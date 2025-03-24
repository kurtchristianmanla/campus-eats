const Order = require('../models/order');

const SYSTEM_USER_ID = '6761bf3b6480598ce47ec999';

async function autoCompleteReadyOrders(io) {
    console.log("Running cron job to check overdue ready orders...");
    const now = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    try {
        const readyOrders = await Order.find({ status: 'ready' }).lean();
        const completedOrders = [];

        for (const order of readyOrders) {
            // Find the most recent "ready" entry in status history
            const latestReadyEntry = order.statusHistory
                .filter(entry => entry.status === 'ready')
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                [0];

            // Check if the order has been in ready status for more than a day
            if (latestReadyEntry && (now - new Date(latestReadyEntry.timestamp) >= ONE_DAY)) {
                try {
                    const updatedOrder = await Order.findByIdAndUpdate(
                        order._id,
                        {
                            $set: { status: 'completed' },
                            $push: {
                                statusHistory: {
                                    status: 'completed',
                                    timestamp: now,
                                    updatedBy: SYSTEM_USER_ID,
                                    reason: 'Auto-completed after 1 day in ready status'
                                }
                            }
                        },
                        { new: true } // Return the updated document
                    );

                    // Emit socket event for the updated order
                    if (io) {
                        io.emit('updateOrder', { order: updatedOrder });
                    }

                    completedOrders.push(updatedOrder);

                    console.log(`Order ${order._id} auto-completed after 1 day in ready status`);
                } catch (updateError) {
                    console.error(`Failed to auto-complete order ${order._id}:`, updateError);
                }
            }
        }

        console.log(`Auto-completed ${completedOrders.length} orders`);

        return { 
            completedCount: completedOrders.length,
            completedOrders: completedOrders.map(order => order._id)
        };
    } catch (error) {
        console.error('Auto-complete error:', error);
        throw error;
    }
}

module.exports = autoCompleteReadyOrders;