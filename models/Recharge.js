const mongoose = require('mongoose');

const rechargeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    proofImage: { type: String, required: true }, // URL Cloudinary
    status: { type: String, default: 'En attente' }, // En attente, Approuvé
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recharge', rechargeSchema);
