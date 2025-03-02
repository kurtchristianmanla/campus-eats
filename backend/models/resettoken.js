const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
    email: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

const ResetToken = mongoose.model('ResetToken', resetTokenSchema);

module.exports = ResetToken;