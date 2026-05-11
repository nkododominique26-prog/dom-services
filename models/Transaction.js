const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    amount: { type: Number, required: true }, // Ex: 500
    price: { type: Number, required: true },  // Ex: 500 FCFA
    status: { type: String, default: 'En attente' }, // 'Validé' ou 'Refusé'
    proofImage: { type: String }, // Lien vers la capture
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
