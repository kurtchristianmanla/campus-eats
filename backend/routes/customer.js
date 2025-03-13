const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const isRightRole = require('../middleware/auth');
const profileRoutes = require('../utils/profileroutes'); 
const User = require('../models/user');
const Counter = require('../models/usercounter');
const Transaction = require('../models/transaction');
const MenuItem = require('../models/menuitem');
const Order = require('../models/order');
const { hybridRecommendations } = require('../utils/recommendationlogic');

// Route to fetch user profile
router.use(isRightRole(['customer']), profileRoutes);

// API Routes
router.get('/find-sellers', isRightRole(['customer']), async (req, res) => {
    try {
    //   const users = await User.find();
        const users = await User.find({
            user_type: 'seller',  // Only sellers
            // is_selling: true       // Sellers who are currently selling
        }).select('_id store_name is_selling user_type email profile_picture seller_rating');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// API Routes
router.get('/find-items', isRightRole(['customer']), async (req, res) => {
    try {
        const highRatedItems = await MenuItem.find({
            averageRating: { $gte: 4, $lte: 5 }, // Filter only 4 to 5 star ratings
            // isAvailable: true, // Only show available items
        });

        if (!highRatedItems.length) {
            return res.status(404).json({ message: 'No high-rated menu items found' });
        }

        res.json(highRatedItems);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Route to Fetch Multiple Items by IDs
router.post('/get-items', isRightRole(['customer']), async (req, res) => {
    try {
        const { ids } = req.body; // Expecting: { ids: ["id1", "id2", ...] }

        // Extract IDs from objects
        const itemIds = ids.map(item => item._id);

        // Validate extracted IDs
        if (!itemIds.length) {
            return res.status(400).json({ message: 'No valid IDs provided' });
        }

        const items = await MenuItem.find({ _id: { $in: ids } }); // MongoDB query
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error });
    }
});

// Route to Get Hybrid Recommendations
router.get('/recommendations', isRightRole(['customer']), async (req, res) => {
    try {
        const userId = req.user.user_id;

        const lastOrder = await Order
            .findOne({ customerId: userId, status: 'completed' })
            .sort({ createdAt: -1 })
            .populate('items.productId', '_id name price imageUrl')
            .lean();

        if (!lastOrder) {
            return res.status(404).json({ message: 'No orders found' });
        }
        
        const itemId = lastOrder.items[0].productId?._id;

        if (!itemId) {
            return res.status(404).json({ message: 'No valid product ID found in the last order' });
        }

        // Fetch necessary data
        const orders = await Order.find({});
        const menuItems = await MenuItem.find({});

        // Get hybrid recommendations
        const recommendations = hybridRecommendations(userId, itemId, orders, menuItems);

        // Fetch details of recommended items
        const recommendedItems = await MenuItem
            .find({ _id: { $in: recommendations } })
            .populate('sellerId', 'username store_name is_selling');

        res.json({recommendedItems, lastOrder});
    } catch (error) {
        console.error('Error fetching recommended items:', error);
        res.status(500).json({ message: 'Error fetching recommendations', error: error.message || error });
    }    
});

module.exports = router;
