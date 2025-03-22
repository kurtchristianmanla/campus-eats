const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the user schema
const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        default: "",
        required: false
    },
    last_name: {
        type: String,
        default: "",
        required: false
    },
    username: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true,
        validate: {
          validator: function(value) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            return passwordRegex.test(value);  // Returns true if password is valid, false otherwise
          },
          message: 'Password must be at least 8 characters long, contain an uppercase letter and a number.' // 
        }
    },
    user_type: {
        type: String,
        required: true,
        enum: ['customer', 'seller', 'admin'] 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function(value) {
                // Apply the email domain validation only for customers
                if (this.user_type === 'customer') {
                    return /^.+@phinmaed\.com$/.test(value); // Validate that the email ends with @phinmaed.com
                }
                return true; // For sellers and admins, email validation is not restricted
            },
            message: 'Email must be from the domain @phinmaed.com'
        }
    },
    balance: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now  // Automatically set the account creation time
    },
    last_login: {
        type: Date,
        default: null  // Set to null initially
    },
    store_name: {
        type: String,
        required: function() {
            return this.user_type === 'seller';
        }
    },
    profile_picture: {
        type: String, // Path to the uploaded profile picture (e.g., '/uploads/profilePic123.jpg')
        required: false
    },
    is_selling: {
        type: Boolean,
        required: function () {
            return this.user_type === 'seller';
        },
        default: null, // Default to null for non-sellers
        validate: {
            validator: function (value) {
                if (this.user_type === 'seller') {
                    return typeof value === 'boolean'; // Ensure it's a boolean for sellers
                }
                return value === null; // Ensure it's null for non-sellers
            },
            message: 'is_selling must be a boolean for sellers or null for others.'
        }
    },
    
    seller_rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
    },
    sessionToken: { type: String, default: null },
});

// Pre-save hook to hash the password before saving to DB
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10); // Hash password
    }
    next();
});

// Pre-save hook to trim whitespace from fields
userSchema.pre('save', function(next) {
    if (this.isModified('first_name') && this.first_name) {
        this.first_name = this.first_name.trim(); // Trim first_name
    }
    if (this.isModified('last_name') && this.last_name) {
        this.last_name = this.last_name.trim(); // Trim last_name
    }
    if (this.isModified('username') && this.username) {
        this.username = this.username.trim(); // Trim username
    }
    if (this.isModified('store_name') && this.store_name) {
        this.store_name = this.store_name.trim(); // Trim store_name
    }
    if (this.isModified('email') && this.store_name) {
        this.store_name = this.store_name.trim(); // Trim store_name
    }
    next();
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the model so it can be used in other parts of the application
module.exports = User;
