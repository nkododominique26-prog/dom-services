const mongoose = require('mongoose');

const rechargeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    method: { type: String, required: true }, // "Orange Money" ou "MTN MoMo"
    status: { type: String, default: 'En attente' }, // "En attente", "Approuvé", "Rejeté"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recharge', rechargeSchema);
