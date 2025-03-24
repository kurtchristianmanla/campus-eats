const Order = require('../models/order');

const SYSTEM_USER_ID = '6761bf3b6480598ce47ec999';

async function autoCompleteReadyOrders(io) {
    const now = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    try {
        // Find orders that have been in ready status for more than 1 day
        const orders = await Order.find({
            status: 'ready',
            readyAt: { 
                $lte: new Date(now - ONE_DAY) 
            }
        });

        for (const order of orders) {
            order.status = 'completed';
            order.statusHistory.push({
                status: 'completed',
                timestamp: now,
                updatedBy: SYSTEM_USER_ID,
                reason: 'Auto-completed after 1 day in ready status'
            });
            
            await order.save();
            io.emit('updateOrder', { order });
            console.log(`Order ${order._id} auto-completed after 1 day in ready status`);
        }

        return { completedCount: orders.length };
    } catch (error) {
        console.error('Auto-complete error:', error);
        throw error; // Let Bull handle retries
    }
}

module.exports = autoCompleteReadyOrders;