// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Transaction = require('../models/transaction')
const isRightRole = require('../middleware/auth');
const { holdPayment, completeOrReleasePayment } = require('../utils/paymentservice')
const { getNextOrderNumber, updateQueueNumbers } = require('../utils/orderutils');

router.post('/create', isRightRole(['customer']), async (req, res) => {
    try {
        const { items, sellerId, orderType = 'regular', scheduledTime } = req.body;

        console.log("Request Body:", req.body);
        
        // Validate if items array is not empty
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }

        let preparationTime = Math.max(...items.map(item => item.maxPrepTime || 0));;
        let expirationTime;


        if (orderType === 'pre-order') {
            if (!scheduledTime) {
                return res.status(400).json({ message: 'Scheduled time is required for pre-orders.' });
            }
            const scheduledDate = new Date(scheduledTime);
            if (isNaN(scheduledDate)) {
                return res.status(400).json({ message: 'Invalid scheduled time format.' });
            }
            if (scheduledDate < new Date()) {
                return res.status(400).json({ message: 'Scheduled time must be in the future.' });
            }

            expirationTime = new Date(new Date(scheduledTime).getTime() - preparationTime * 60 * 1000);
        } else {
            expirationTime = new Date(Date.now() + 30 * 60 * 1000);
        }

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Generate Order Number
        const orderNumber = await getNextOrderNumber();

        const newOrder = new Order({
            orderNumber: orderNumber,
            items: items.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                sellerId: item.sellerId,
                minPrepTime: item.minPrepTime,
                maxPrepTime: item.maxPrepTime,
                imageUrl: item.imageUrl
            })),
            sellerId: sellerId,
            customerId: req.user.user_id,
            status: 'pending',
            totalAmount: totalAmount,
            paymentStatus: 'pending',
            expirationTime: expirationTime,
            preparationTime: preparationTime,
            orderType: orderType,
            scheduledTime: orderType === 'pre-order' ? scheduledTime : null,
            statusHistory: [{
                status: 'pending',
                updatedBy: req.user.user_id,
                timestamp: new Date()
            }],
        });

        console.log(`Processing order for seller: ${sellerId}`); 
        console.log("Step 1: Order creation"); 

        await newOrder.save();
        console.log(`Order saved successfully for seller: ${sellerId}`); 

        console.log("Step 2: Holding payment"); 
        // Hold Payment Before Creating the Order
        const holdResponse = await holdPayment(req.io, req.user.user_id, newOrder._id, totalAmount);
        console.log("Hold Payment Response:", holdResponse); 
        if (!holdResponse.success) {
            await Order.findByIdAndDelete(newOrder._id);
            return res.status(400).json({ message: holdResponse.message });
        }

        // Update the order with payment status and transaction ID
        newOrder.paymentStatus = 'hold';
        newOrder.paymentTransactionId = holdResponse.transactionId;
        // await newOrder.save();
        try {
            await newOrder.save();
            console.log(`Order saved for seller ${sellerId}`);
        } catch (dbError) {
            console.error(`Database error for seller ${sellerId}:`, dbError);
            return res.status(500).json({ message: "Database error" });
        }

        console.log("You go here");
        req.io.emit('newOrder', { newOrder, sellerId });
        console.log("You maybe here");
        
        // Clear the cart from localStorage after successful order creation
        res.json({ 
            message: `${orderType === 'pre-order' ? 'Pre-order' : 'Order'} created successfully`, 
            order: newOrder 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Move to PREPARING status (Seller confirms order)
router.put('/prepare/:orderId', isRightRole(['seller']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order is in PENDING status
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order must be in pending status' });
        }

        // Verify if the authenticated user is the seller
        if (order.sellerId.toString() !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Set status based on order type
        if (order.orderType === 'pre-order') {
            order.status = 'pre-order';
        } else {
            order.status = 'preparing';

            // Process payment only for non-pre-order types
            order.paymentStatus = 'completed';

            if (order.paymentTransactionId) {
                const paymentDone = await completeOrReleasePayment(req.io, order.paymentTransactionId, 'completed');
                console.log(`Order ${order._id}: ${paymentDone.message}`);
            }
        }

        // order.status = order.orderType === 'pre-order' ? 'pre-order' : 'preparing';
        // order.paymentStatus = 'completed';   

        order.statusHistory.push({
            status: order.status,
            updatedBy: req.user.user_id,
            timestamp: new Date()
        });

        const lastOrder = await Order.findOne({ sellerId: order.sellerId, status: "preparing" })
            .sort({ queueNumber: -1 })
            .select("queueNumber");

        const nextQueueNumber = lastOrder ? lastOrder.queueNumber + 1 : 1;

        order.queueNumber = nextQueueNumber;

        // // Update the related transaction's status
        // if (order.paymentTransactionId) {
        //     const paymentDone = await completeOrReleasePayment(req.io, order.paymentTransactionId, 'completed');
        //     console.log(`Order ${order._id}: ${paymentDone.message}`);
        // }

        await order.save();

        req.io.emit('updateOrder', { order });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
  
// Move to READY status (Seller finished preparing)
router.put('/ready/:orderId', isRightRole(['seller']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
        return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'preparing') {
            return res.status(400).json({ message: 'Order must be in preparing status' });
        }

        if (order.sellerId.toString() !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        order.status = 'ready';
        order.queueNumber = null;
        order.statusHistory.push({
            status: 'ready',
            updatedBy: req.user.user_id,
            timestamp: new Date()
        });

        await order.save();

        await updateQueueNumbers(req.io);

        req.io.emit('updateOrder', { order });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
  
// Move to COMPLETED status (Customer received order)
router.put('/complete/:orderId', isRightRole(['customer']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'ready') {
            return res.status(400).json({ message: 'Order must be in ready status' });
        }

        // Verify if the authenticated user is the customer
        if (order.customerId.toString() !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to complete this order' });
        }

        order.status = 'completed';
        // order.queueNumber = null;
        order.statusHistory.push({
            status: 'completed',
            updatedBy: req.user.user_id,
            timestamp: new Date()
        });

        await order.save();

        // await updateQueueNumbers();

        req.io.emit('updateOrder', { order });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
  
// Cancel order (can be done by seller or customer when in PENDING status)
router.put('/cancel/:orderId', isRightRole(['seller', 'customer']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        const { reason } = req.body;

        console.log('Reason:', reason);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending' && order.status !== 'preparing') {
            return res.status(400).json({ message: 'Only pending and preparing orders can be cancelled' });
        }

        // Check if user is either the customer or seller
        if (order.customerId.toString() !== req.user.user_id && 
            order.sellerId.toString() !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        if (order.status === 'pending') {
            order.paymentStatus = 'released';
        } else if (order.status === 'preparing') {
            order.paymentStatus = 'refunded';
        } else {
            throw new Error('Invalid status. Must be "pending" or "preparing".');
        }

        order.status = 'cancelled';
        order.queueNumber = null;
        order.statusHistory.push({
            status: 'cancelled',
            updatedBy: req.user.user_id,
            reason: reason,
            timestamp: new Date()
        });

        // Update the related transaction's status
        if (order.paymentTransactionId) {
            const refundResult = await completeOrReleasePayment(req.io, order.paymentTransactionId, order.paymentStatus);
            console.log(`Order ${order._id}: ${refundResult.message}`);

            const transaction = await Transaction.findOne({ transactionId: order.paymentTransactionId });
            if (transaction) {
                transaction.status = 'refunded'; // Change status to 'released'
                transaction.details = {
                    ...transaction.details,
                    cancelledReason: reason
                };
                await transaction.save();
            }
        }

        await order.save();

        await updateQueueNumbers(req.io);

        req.io.emit('updateOrder', { order });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
  
// Get orders for a user (either as customer or seller)
router.get('/', isRightRole(['seller', 'customer']), async (req, res) => {
    try {
        const { user } = req; // 'seller' or 'customer'

        // console.log(user);

        let query = {};
        if (user.user_type === 'seller') {
            query.sellerId = user.user_id; // Token provides the ID
        } else if (user.user_type === 'customer') {
            query.customerId = user.user_id;
        }

        const orders = await Order.find(query)
        .sort({ createdAt: -1 }); // Most recent first

        // console.log(orders);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
  
// Get single order details
router.get('/:orderId', isRightRole(['seller', 'customer']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
        return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is either the customer or seller
        if (order.customerId.toString() !== req.user.user_id && 
            order.sellerId.toString() !== req.user.user_id) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;