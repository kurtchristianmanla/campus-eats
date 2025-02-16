const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming sellers are also stored in a 'User' collection
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    minPrepTime: {
        type: Number,
        required: true,
        min: 0, // Ensure it's a positive number
    },
    maxPrepTime: {
        type: Number,
        required: true,
        min: 0, // Ensure it's a positive number
        validate: {
            validator: function(value) {
                return value >= this.minPrepTime; // maxPrepTime must be greater than or equal to minPrepTime
            },
            message: 'maxPrepTime must be greater than or equal to minPrepTime.',
        },
    },
    description: {
        type: String, // Optional description field
    },
    price: {
        type: Number,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true, // Menu items are available by default
    },
    imageUrl: {
        type: String, // URL for an image of the product
    },
    averageRating: { type: Number, default: 0 } // Precomputed average
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
