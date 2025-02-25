const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: { 
        type: String, 
        unique: true, 
        required: true 
    }, // Custom ID for users
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // Reference to User
    type: { 
        type: String, 
        enum: ['cashout', 'top-up', 'pay', 'hold', 'release', 'refund'], 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'hold', 'completed', 'released', 'refunded'], 
        default: 'pending' 
    },
    // Placeholder for payment or additional data
    details: {
        type: mongoose.Schema.Types.Mixed, // Allows flexibility (can be an object or string)
        default: null,
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    userBalanceAfter: {
        type: Number,
        required: true,
    },
    sellerBalanceAfter: {
        type: Number,
        required: false,
        default: null,
    },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
