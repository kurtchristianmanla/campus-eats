const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const upload = require('../middleware/upload');
const isRightRole = require('../middleware/auth'); 
const mongoose = require('../db/db');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const Order = require('../models/order');
const profileRoutes = require('../utils/profileroutes'); 

const jwt = require('jsonwebtoken');
const secret_key = process.env.JWT_SECRET_KEY;
const { completeOrReleasePayment } = require('../utils/paymentservice')

// API Routes

// Route to fetch completed transactions for a specific seller
router.get('/transactions', isRightRole(['seller']), async (req, res) => {
    try {
        const sellerId = req.user.user_id; // Assuming the seller's ID is available in the request

        // Step 1: Fetch top-up and cashout transactions for the seller
        const directTransactions = await Transaction.find({
            user: sellerId, // Seller is the user in these transactions
            type: { $in: ['top-up', 'cashout'] }, // Only top-up and cashout types
            status: 'completed' // Only completed transactions
        })
        .populate('user', 'store_name username') // Populate user details (seller)
        .exec();

        // console.log("Default:", directTransactions);

        // Step 2: Fetch pay transactions indirectly via orders
        // Find all orders for the seller
        const orders = await Order.find({ 
            sellerId: sellerId, // Filter by seller ID
            paymentStatus: 'completed' // Only completed orders
        });

        // Extract paymentTransactionIds from the orders
        const paymentTransactionIds = orders.map(order => order.paymentTransactionId);

        // console.log("Pay Transaction IDs:", paymentTransactionIds);

        // Find transactions associated with these paymentTransactionIds
        const payTransactions = await Transaction.find({
            transactionId: { $in: paymentTransactionIds }, // Match transaction IDs
            type: 'pay', // Only pay type
            status: 'completed' // Only completed transactions
        })
        .populate('user', 'store_name username') // Populate user details (customer)
        .exec();

        // console.log("Pay Transactions:", payTransactions);

        // Step 3: Combine both sets of transactions
        const allTransactions = [...directTransactions, ...payTransactions];

        // console.log("Transaction IDs:", allTransactions);

        // Step 4: Add orderNumber to pay transactions
        const transactionsWithOrderNumber = await Promise.all(allTransactions.map(async (transaction) => {
            if (transaction.type === 'pay') {
                // Find the order associated with the transaction
                const order = await Order.findOne({ 
                    paymentTransactionId: transaction.transactionId 
                });

                // Add order number to the transaction details
                if (order) {
                    transaction.details = transaction.details || {};
                    transaction.details.orderNumber = order.orderNumber;
                }
            }
            return transaction;
        }));

        // console.log("Transactions:", transactionsWithOrderNumber);

        res.json(transactionsWithOrderNumber);  // Send the modified data to the frontend
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/manage-orders', isRightRole(['seller']), async (req, res) => {
    try {
        // Find the user in the database using the decoded user ID
        const user = await User.findById(req.user.user_id).select('-password'); // Exclude password field for security
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// router.put('/set-status', isRightRole(['seller']), async (req, res) => {
//     const { is_selling } = req.body;
//     console.log(is_selling);
//     try {
//         // Find the user in the database using the decoded user ID
//         const user = await User.findById(req.user.user_id).select('-password'); // Exclude password field for security
//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }

//         user.is_selling = is_selling;

//         await user.save();

//         req.io.emit('sellerStatusChanged', {
//             sellerId: user._id,
//             isSelling: user.is_selling,
//             storeName: user.store_name,
//             profilePicture: user.profile_picture
//         });

//         res.json({ status: user.is_selling });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

router.put('/set-status', isRightRole(['seller']), async (req, res) => {
    const { is_selling } = req.body;
    try {
        const user = await User.findById(req.user.user_id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check for preparing orders
        const preparingOrders = await Order.find({ sellerId: user._id, status: 'preparing' });
        if (preparingOrders.length > 0 && !is_selling) {
            return res.status(400).json({ message: 'Cannot deactivate while there are preparing orders.' });
        }

        if (!is_selling) {
            // Cancel all pending orders
            // const pendingOrders = await Order.find({ sellerId: user._id, status: 'pending' });
            const pendingOrders = await Order.find({ 
                sellerId: user._id, 
                status: { $in: ['pending', 'pre-order'] } 
            });

            for (const order of pendingOrders) {
                order.paymentStatus = 'released';
                order.status = 'cancelled';
                order.statusHistory.push({
                    status: 'cancelled',
                    updatedBy: req.user.user_id,
                    reason: 'Seller deactivated store',
                    timestamp: new Date()
                });

                if (order.paymentTransactionId) {
                    await completeOrReleasePayment(req.io, order.paymentTransactionId, order.paymentStatus);

                    const transaction = await Transaction.findOne({ transactionId: order.paymentTransactionId });
                    if (transaction) {
                        transaction.status = 'released';
                        transaction.details = {
                            ...transaction.details,
                            cancelledReason: 'Seller deactivated store'
                        };
                        await transaction.save();
                    }
                }

                await order.save();
                req.io.emit('updateOrder', { order });
            }
        }

        user.is_selling = is_selling;
        await user.save();

        req.io.emit('sellerStatusChanged', {
            sellerId: user._id,
            isSelling: user.is_selling,
            storeName: user.store_name,
            profilePicture: user.profile_picture
        });

        res.json({ status: user.is_selling });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to fetch user profile
router.use(isRightRole(['seller']), profileRoutes);


module.exports = router;