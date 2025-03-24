// models/passwordlog.js
const mongoose = require('mongoose');

const passwordLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to the User model
    },
    plaintextPassword: {
        type: String,
        required: true,
    },
    iv: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const PasswordLog = mongoose.model('PasswordLog', passwordLogSchema);

module.exports = PasswordLog;