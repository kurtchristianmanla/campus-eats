const Order = require('../models/order');
const Transaction = require('../models/transaction');
const { completeOrReleasePayment } = require('../utils/paymentservice');

const SYSTEM_USER_ID = '6761bf3b6480598ce47ec999';

// Runs every minute
async function autoCancelOrders(io) {
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = new Date();

    const orders = await Order.find({
        status: 'pending',
        paymentStatus: 'hold',
        createdAt: { $lte: new Date(now - THIRTY_MINUTES) }
    });

    for (const order of orders) {
        order.status = 'cancelled';
        order.queueNumber = null;
        order.paymentStatus = 'released';
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            updatedBy: SYSTEM_USER_ID,
            reason: 'Auto-cancelled due to inactivity'
        });
        await order.save();

        // Update the related transaction's status
        if (order.paymentTransactionId) {
            const refundResult = await completeOrReleasePayment(io, order.paymentTransactionId, 'released');
            console.log(`Order ${order._id}: ${refundResult.message}`);

            io.emit('updateOrder', { order });

            const transaction = await Transaction.findOne({ transactionId: order.paymentTransactionId });
            if (transaction) {
                transaction.status = 'released'; // Change status to 'released'
                transaction.details = {
                    ...transaction.details,
                    cancelledReason: 'Auto-cancelled due to order inactivity'
                };
                await transaction.save();
            }
        }
    }

    if (orders.length) {
        console.log(`Auto-cancelled ${orders.length} orders.`);
    }
};

module.exports = autoCancelOrders;