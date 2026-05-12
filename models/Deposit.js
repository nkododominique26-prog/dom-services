const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    proofImage: { type: String, required: true },
    status: { type: String, enum: ['en_attente', 'valide', 'rejete'], default: 'en_attente' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deposit', depositSchema);
