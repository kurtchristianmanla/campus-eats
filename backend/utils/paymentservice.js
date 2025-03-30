const User = require('../models/user');
const Order = require('../models/order');
const Transaction = require('../models/transaction');
const { generateTransactionId } = require('./transacutils');
const mongoose = require('../db/db');

// At the top of paymentservice.js
const userLocks = new Map();

const acquireLock = async (userId) => {
    while (userLocks.has(userId)) {
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    userLocks.set(userId, true);
};

const releaseLock = (userId) => {
    userLocks.delete(userId);
};

const holdPayment = async (io, userId, orderId, orderAmount, retryCount = 0) => {
    try { 
        await acquireLock(userId);
           
        const MAX_RETRIES = 5;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found.');
            if (user.balance < orderAmount) throw new Error('Insufficient balance.');

            // Deduct temporarily (hold)
            user.balance -= orderAmount;
            await user.save({ session });

            // Fetch the order details
            const order = await Order.findById(orderId).populate('sellerId', 'store_name').session(session); // Get store_name from seller

            if (!order) throw new Error('Order not found.');

            // Prepare transaction details
            const transactionDetails = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                store_name: order.sellerId.store_name,
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity
                }))
            };

            // Create hold transaction
            const transactionId = await generateTransactionId();
            console.log("New Transaction ID: ", transactionId);

            const holdTransaction = new Transaction({
                transactionId,
                user: user._id,
                type: 'pay',
                amount: orderAmount,
                status: 'hold',
                details: transactionDetails,
                userBalanceAfter: user.balance,
            });

            await holdTransaction.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            io.emit('updateBalance', { balance: user.balance, userId: user._id });
            
            return { success: true, message: 'Payment held successfully.', transactionId };
        } catch (error) {
            // Abort the transaction on error
            await session.abortTransaction();
            session.endSession();
            
            // If it's a write conflict and we haven't exceeded max retries, try again
            if (error.message.includes('Write conflict') && retryCount < MAX_RETRIES) {
                console.log(`Transaction write conflict, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                return holdPayment(io, userId, orderId, orderAmount, retryCount + 1);
            }
            
            return { success: false, message: error.message };
        } finally {
            releaseLock(userId);
        }
    } catch (lockError) {
        return { success: false, message: 'Failed to acquire lock for user.' };
    }
};

const completeOrReleasePayment = async (io, transactionId, status, retryCount = 0) => {
    try {
        await acquireLock(transactionId);

        const MAX_RETRIES = 5;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const transaction = await Transaction.findOne({ transactionId }).session(session);
            if (!transaction || (transaction.status !== 'completed' && transaction.status !== 'hold')) {
                throw new Error('Transaction not found or not on hold.');
            }

            const user = await User.findById(transaction.user).session(session);
            if (!user) throw new Error('User not found.');

            const order = await Order.findById(transaction.details.orderId).populate('sellerId').session(session);
            if (!order) throw new Error('Order not found.');

            if (status === 'completed') {
                // Mark as completed (funds are already deducted during hold)
                transaction.status = 'completed';
                transaction.type = 'pay';

                // Transfer the funds to the seller
                const seller = await User.findById(order.sellerId).session(session);
                if (!seller) throw new Error('Seller not found.');

                seller.balance += transaction.amount;
                await seller.save({ session });

                // Update the order status
                order.paymentStatus = 'completed';
                await order.save({ session });

                transaction.sellerBalanceAfter = seller.balance;

                io.emit('updateBalance', { balance: user.balance, userId: user._id });

            } else if (status === 'released'){
                // Release the hold (refund)
                user.balance += transaction.amount; // Refund the held amount
                transaction.status = 'released';
                transaction.type = 'pay';
                await user.save({ session });

                io.emit('updateBalance', { balance: user.balance, userId: user._id });

            } else if (status === 'refunded'){
                if (order.paymentStatus === 'completed') {
                    // Deduct the money from the seller's balance
                    const seller = await User.findById(order.sellerId).session(session);
                    if (!seller) throw new Error('Seller not found.');

                    if (seller.balance < transaction.amount) {
                        throw new Error('Seller has insufficient balance to refund.');
                    }

                    seller.balance -= transaction.amount;
                    await seller.save({ session });

                    transaction.sellerBalanceAfter = seller.balance;
                }

                // Release the hold (refund)
                user.balance += transaction.amount; // Refund the held amount
                transaction.status = 'refunded';
                transaction.type = 'pay';
                await user.save({ session });

                io.emit('updateBalance', { balance: user.balance, userId: user._id });
            } else {
                throw new Error('Invalid action. Use "complete", "released", or "refunded".');
            }

            transaction.userBalanceAfter = user.balance;

            await transaction.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            return { success: true, message: status ? 'Payment completed.' : 'Hold released and refunded.' };
        } catch (error) {
            // Abort the transaction on error
            await session.abortTransaction();
            session.endSession();

            // If it's a write conflict and we haven't exceeded max retries, try again
            if (error.message.includes('Write conflict') && retryCount < MAX_RETRIES) {
                console.log(`Transaction write conflict, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                return completeOrReleasePayment(io, transactionId, status, retryCount + 1);
            }
            
            return { success: false, message: error.message };
        } finally {
            releaseLock(transactionId);
        }
    } catch (lockError) {
        return { success: false, message: 'Failed to acquire lock for transaction.' };
    }
};

module.exports = { holdPayment, completeOrReleasePayment };
