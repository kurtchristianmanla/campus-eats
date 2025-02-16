// utils/orderNumberGenerator.js
const OrderCounter = require('../models/ordercounter');
const Order = require('../models/order')

async function getNextOrderNumber() {
    const counter = await OrderCounter.findByIdAndUpdate(
        "orderNumber",
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );

    // Convert number to 4-digit zero-padded format
    return counter.sequence_value.toString().padStart(4, "0");
}

async function updateQueueNumbers(io) {

    // Find all unique sellers with "preparing" orders
    const sellers = await Order.distinct("sellerId", { status: "preparing" });

    for (const sellerId of sellers) {
        const remainingOrders = await Order.find({
            // orderType: { $ne: 'pre-order' },
            sellerId,
            status: 'preparing'
        }).sort({ queueNumber: 1 });

        console.log("Before Update:", remainingOrders);

        // for (let i = 0; i < remainingOrders.length; i++) {
        //     remainingOrders[i].queueNumber = i + 1;
        //     await remainingOrders[i].save();
        // }

        const bulkOps = remainingOrders.map((order, index) => ({
            updateOne: {
                filter: { _id: order._id },
                update: { queueNumber: index + 1 }
            }
        }));

        if (bulkOps.length > 0) {
            await Order.bulkWrite(bulkOps);
        }

        // Fetch updated orders from the database
        const orders = await Order.find({ sellerId, status: 'preparing' }).sort({ queueNumber: 1 });

        console.log("After Update:", orders);

        orders.forEach((updatedOrder) => {
            console.log(`${updatedOrder.customerId}`);
        });
        
        // Emit globally, letting the frontend filter its own orders
        io.emit('updateQueue', { orders });
        
        console.log("Emitted updateQueue event:", orders);
    }
}

module.exports = { getNextOrderNumber, updateQueueNumbers };
