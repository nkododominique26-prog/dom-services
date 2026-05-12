const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 }, // Ton système de Coins
    role: { type: String, default: 'client' },
    subscriptions: [{
        serviceName: String,
        expiryDate: Date,
        status: { type: String, default: 'active' }
    }]
});

module.exports = mongoose.model('User', userSchema);
