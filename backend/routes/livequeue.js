const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Order = require('../models/order');
const Transaction = require('../models/transaction')

// Get orders for a user (either as customer or seller)
router.get('/', async (req, res) => {
    try {
        // Fetch all online sellers (assuming you have an `is_selling` field in the User model)
        const onlineSellers = await User.find({ user_type: 'seller' });

        // Fetch orders for all online sellers
        const orders = await Order.find({
            sellerId: { $in: onlineSellers.map(seller => seller._id) },
            status: { $in: ['preparing', 'ready'] }
        }).sort({ createdAt: 1 }); // Sort by creation time

        // Group orders by sellerId
        const queueBySeller = onlineSellers.map(seller => {
            return {
                sellerId: seller._id,
                sellerName: seller.store_name,
                isSelling: seller.is_selling,
                sellerBanner: seller.profile_picture,
                orders: orders.filter(order => order.sellerId.toString() === seller._id.toString())
            };
        });

        res.json(queueBySeller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;