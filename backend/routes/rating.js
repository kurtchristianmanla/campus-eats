const express = require('express');
const Rating = require('../models/rating');
const Order = require('../models/order')
const MenuItem = require('../models/menuitem');
const User = require('../models/user');
const router = express.Router();

// Middleware to protect routes (Assuming you have authentication middleware)
const isRightRole = require('../middleware/auth');

router.post('/product', isRightRole(['customer']), async (req, res) => {
    const { productId, orderId, rating, review } = req.body;
    const customerId = req.user.user_id;  // Assuming user is authenticated

    try {
        // Check if the order is completed and contains this product
        const order = await Order.findOne({
            _id: orderId,
            customerId: customerId,
            status: 'completed',
            "items.productId": productId
        });

        if (!order) {
            return res.status(400).json({ error: "You can only rate products from completed orders." });
        }

        // Check if the user has already rated this product in this order
        const existingRating = await Rating.findOne({ customerId, productId, orderId });
        if (existingRating) {
            return res.status(400).json({ message: "You have already rated this product in this order." });
        }

        const newRating = new Rating({ productId, customerId, orderId, rating, review });
        await newRating.save();

        // Update the product’s average rating
        const ratings = await Rating.find({ productId });
        const totalRatings = ratings.length;
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

        await MenuItem.findByIdAndUpdate(productId, { averageRating: avgRating });

        // --- Update Seller Rating ---
        const product = await MenuItem.findById(productId).populate("sellerId"); // Get product seller
        if (product && product.sellerId) {
            const sellerId = product.sellerId._id;

            // Fetch all products of the seller
            const sellerProducts = await MenuItem.find({ sellerId });
            const productIds = sellerProducts.map(p => p._id);

            // Fetch all ratings for seller's products
            const sellerRatings = await Rating.find({ productId: { $in: productIds } });

            // Calculate weighted average rating
            let totalWeightedRating = 0;
            let totalReviews = 0;
            const ratingCount = {}; // Track review count per product

            sellerRatings.forEach((r) => {
                if (!ratingCount[r.productId]) ratingCount[r.productId] = 0;
                ratingCount[r.productId]++;
            });

            for (const [id, count] of Object.entries(ratingCount)) {
                const product = await MenuItem.findById(id);
                totalWeightedRating += (product.averageRating || 0) * count;
                totalReviews += count;
            }

            const sellerAvgRating = totalReviews > 0 ? (totalWeightedRating / totalReviews).toFixed(2) : null;

            await User.findByIdAndUpdate(sellerId, { seller_rating: sellerAvgRating });
        }

        res.status(201).json({ message: "Rating added successfully.", newRating  });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
