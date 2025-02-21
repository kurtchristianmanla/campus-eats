const Order = require('../models/order');
const { completeOrReleasePayment } = require('../utils/paymentservice')

const SYSTEM_USER_ID = '6761bf3b6480598ce47ec999';

// Runs every minute
async function autoPrepareOrders(io) {
    const now = new Date();

    try {
        const orders = await Order.find({
            status: 'pre-order',
            orderType: 'pre-order',
            scheduledTime: { $ne: null },
            preparationTime: { $ne: null }
        });

        for (const order of orders) {
            const prepStartTime = new Date(order.scheduledTime.getTime() - (order.preparationTime * 60 * 1000));

            if (now >= prepStartTime) {
                order.status = 'preparing';
                order.statusHistory.push({
                    status: 'preparing',
                    timestamp: new Date(),
                    updatedBy: SYSTEM_USER_ID,
                    reason: 'Auto-moved to preparing based on scheduled preparation time'
                });

                if (order.paymentTransactionId) {
                    const paymentDone = await completeOrReleasePayment(io, order.paymentTransactionId, 'completed');
                    
                    if (paymentDone.success) { // Assuming the function returns { success: true/false, message: '' }
                        order.paymentStatus = 'completed';
                        console.log(`Payment for Order ${order._id} marked as 'completed'.`);
                    } else {
                        console.error(`Payment failed for Order ${order._id}: ${paymentDone.message}`);
                    }
                }

                const lastOrder = await Order.findOne({ sellerId: order.sellerId, status: "preparing" })
                    .sort({ queueNumber: -1 })
                    .select("queueNumber");

                const nextQueueNumber = lastOrder ? lastOrder.queueNumber + 1 : 1;

                order.queueNumber = nextQueueNumber;

                try {
                    await order.save();
                } catch (saveError) {
                    console.error(`Failed to save order ${order._id}:`, saveError);
                }

                io.emit('updateOrder', { order });

                console.log(`Order ${order._id} moved to 'preparing' status.`);
            }
        }
    } catch (error) {
        console.error('Preparation time tracking error:', error);
    }
};

module.exports = autoPrepareOrders;