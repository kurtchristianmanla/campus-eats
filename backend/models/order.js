// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true, required: true },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        minPrepTime: {
            type: Number,
            required: true
        },
        maxPrepTime: {
            type: Number,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        }
    }],
  
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    status: {
        type: String,
        enum: ['cart', 'pending', 'preparing', 'ready', 'completed', 'cancelled', 'pre-order'],
        default: 'cart'
    },

    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'hold', 'released', 'completed', 'refunded'], default: 'pending' },
    
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reason: {
            type: String
        }
    }],

    createdAt: { type: Date, default: Date.now },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    expirationTime: { type: Date }, 
    autoCancelled: { type: Boolean, default: false },
    paymentTransactionId: { type: String },

    orderType: {
        type: String,
        enum: ['regular', 'pre-order'],
        default: 'regular'  // Default to 'regular' if not specified
    },

    scheduledTime: {
        type: Date,
        validate: {
            validator: function (value) {
                return this.orderType === 'pre-order' ? value != null : true;
            },
            message: 'Scheduled time is required for pre-orders.'
        }
    },

    preparationTime: {
        type: Number,
        validate: {
            validator: function (value) {
                return this.orderType === 'pre-order' ? value != null : true;
            },
            message: 'Preparation time is required for pre-orders.'
        }
    },

    queueNumber: { type: Number, required: false }
});

// Update the updatedAt timestamp before saving
orderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;