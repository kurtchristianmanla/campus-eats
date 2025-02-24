const Order = require('../models/order');
const Transaction = require('../models/transaction');
const { completeOrReleasePayment } = require('../utils/paymentservice')

const SYSTEM_USER_ID = '6761bf3b6480598ce47ec999';

// Runs every minute
async function autoCancelOverdueOrders(io) {
    console.log("Running cron job to check overdue preparing orders...");
    const now = new Date();
    const offsetTime = 10;

    try {
        const orders = await Order.find({
            status: 'preparing',
            autoCancelled: false,
            preparationTime: { $gt: 0 }, // Ensure preparationTime is present
        });

        const warningOrders = [];
        const overdueOrders = [];
        const warnedOrders = new Set();

        // const warningOrders = orders.filter(order => {
        //     const preparingEntry = order.statusHistory.find(s => s.status === "preparing");
        //     if (!preparingEntry) return false; // Skip if no "preparing" status
        
        //     const prepStartTime = new Date(preparingEntry.timestamp);
        //     const overdueTime = new Date(prepStartTime.getTime() + (order.preparationTime) * 60 * 1000);
        
        //     return now > overdueTime; // If now is past the overdue time, it's overdue
        // });

        // if (warningOrders.length !== 0) {
        //     for (const warningOrder of warningOrders) {
        //         io.emit('overdueOrder', { warningOrder });
        //         return;
        //     }
        // }

        // const overdueOrders = orders.filter(order => {
        //     const preparingEntry = order.statusHistory.find(s => s.status === "preparing");
        //     if (!preparingEntry) return false; // Skip if no "preparing" status
        
        //     const prepStartTime = new Date(preparingEntry.timestamp);
        //     const overdueTime = new Date(prepStartTime.getTime() + (order.preparationTime + offsetTime) * 60 * 1000);
        
        //     return now > overdueTime; // If now is past the overdue time, it's overdue
        // });

        // if (overdueOrders.length === 0) {
        //     console.log("No overdue orders found.");
        // }

        for (const order of orders) {
            const preparingEntry = order.statusHistory.find(s => s.status === "preparing");
            if (!preparingEntry) continue; // Skip if no "preparing" status

            const prepStartTime = new Date(preparingEntry.timestamp);
            const overdueTime = new Date(prepStartTime.getTime() + order.preparationTime * 60 * 1000);
            const finalOverdueTime = new Date(prepStartTime.getTime() + (order.preparationTime + offsetTime) * 60 * 1000);

            if (now > overdueTime && now <= finalOverdueTime && !warnedOrders.has(order._id.toString())) {
                warningOrders.push(order);
                // warnedOrders.add(order._id.toString());
            } else if (now > finalOverdueTime) {
                overdueOrders.push(order);
            }
        }

        // Emit all warning orders at once
        if (warningOrders.length > 0) {
            // io.emit('overdueOrder', { warningOrders });
            warningOrders.forEach(order => {
                io.to(`seller_${order.sellerId}`).emit('overdueOrder', { 
                    message: `Order #${order.orderNumber} is overdue!`, 
                    order 
                });
            });
        } else {
            console.log("No overdue orders found.");
        }

        // if (overdueOrders.length === 0) {
        //     console.log("No overdue orders found.");
        //     return;
        // }

        for (const order of overdueOrders) {
            order.status = 'cancelled';
            order.queueNumber = null;
            order.paymentStatus = 'refunded';
            order.statusHistory.push({
                status: 'cancelled',
                timestamp: now,
                updatedBy: SYSTEM_USER_ID,
                reason: 'Auto-cancelled due to overdue preparation time.'
            });
            await order.save();

            // Update the related transaction's status
            if (order.paymentTransactionId) {
                const refundResult = await completeOrReleasePayment(io, order.paymentTransactionId, 'refunded');
                console.log(`Order ${order._id}: ${refundResult.message}`);

                io.emit('updateOrder', { order });

                const transaction = await Transaction.findOne({ transactionId: order.paymentTransactionId });
                if (transaction) {
                    transaction.status = 'refunded';
                    transaction.details = {
                        ...transaction.details,
                        cancelledReason: 'Auto-cancelled due to overdue preparation time.'
                    };
                    await transaction.save();
                }
            }
        }
    } catch (error) {
        console.error('Overdue orders tracking error:', error);
    }
};

module.exports = autoCancelOverdueOrders;