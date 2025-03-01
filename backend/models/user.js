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
        // required: function () {
        //     return this.user_type === 'seller';
        // },
        min: 1,
        max: 5,
        default: null, // Default to null for non-sellers
        // validate: {
        //     validator: function (value) {
        //         if (this.user_type === 'seller') {
        //             return value >= 1 && value <= 5; // Rating should be between 0 and 5 for sellers
        //         }
        //         return value === null; // Ensure it's null for non-sellers
        //     },
        //     message: 'Seller rating must be between 1 and 5.'
        // }
    },
});

// Pre-save hook to hash the password before saving to DB
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10); // Hash password
    }
    next();
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the model so it can be used in other parts of the application
module.exports = User;
