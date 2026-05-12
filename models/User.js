const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 }, // Solde du client
    role: { type: String, enum: ['client', 'admin', 'subordonne'], default: 'client' },
    subscriptions: [{
        serviceName: String,
        expiryDate: Date,
        status: { type: String, default: 'active' }
    }]
});

module.exports = mongoose.model('User', userSchema);
