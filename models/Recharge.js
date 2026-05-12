const mongoose = require('mongoose');
const rechargeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    method: String,
    proofImage: String,
    status: { type: String, default: 'En attente' },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Recharge', rechargeSchema);
