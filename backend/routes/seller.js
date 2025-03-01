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
        const sellerId = req.user.user_id; // Seller's ID from the request

        // Step 1: Fetch direct transactions (top-up and cashout) and orders in parallel
        const [directTransactions, orders] = await Promise.all([
            // Fetch direct transactions
            Transaction.find({
                user: sellerId,
                type: { $in: ['top-up', 'cashout'] },
                status: 'completed'
            })
            .populate({
                path: 'user',
                select: 'store_name username',
                options: { lean: true } // Use lean() for better performance
            })
            .lean(),

            // Fetch completed orders for the seller
            Order.find({ 
                sellerId: sellerId,
                paymentStatus: 'completed'
            })
            .lean()
        ]);

        // Step 2: Extract paymentTransactionIds from orders
        const paymentTransactionIds = orders.map(order => order.paymentTransactionId);

        // Step 3: Fetch pay transactions associated with the paymentTransactionIds
        const payTransactions = await Transaction.find({
            transactionId: { $in: paymentTransactionIds },
            type: 'pay',
            status: 'completed'
        })
        .populate({
            path: 'user',
            select: 'store_name username',
            options: { lean: true }
        })
        .lean();

        // Step 4: Create a map of paymentTransactionId to orderNumber for quick lookup
        const orderNumberMap = orders.reduce((map, order) => {
            map[order.paymentTransactionId] = order.orderNumber;
            return map;
        }, {});

        // Step 5: Handle deleted users and add orderNumber to pay transactions
        const transactionsWithOrderNumber = [
            // Handle direct transactions
            ...directTransactions.map(transaction => ({
                ...transaction,
                user: transaction.user || {
                    store_name: 'Account Deleted',
                    username: 'Account Deleted'
                }
            })),
            // Handle pay transactions
            ...payTransactions.map(transaction => ({
                ...transaction,
                user: transaction.user || {
                    store_name: 'Account Deleted',
                    username: 'Account Deleted'
                },
                details: {
                    ...transaction.details,
                    orderNumber: orderNumberMap[transaction.transactionId] || null
                }
            }))
        ];

        // Step 6: Send the response
        res.json(transactionsWithOrderNumber);
    } catch (err) {
        console.error("Error fetching transactions:", err.message, err.stack);
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