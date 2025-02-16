const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: {  // Reference to the order where the product was bought
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

const Rating = mongoose.model('ProductRating', ratingSchema);
module.exports = Rating;
