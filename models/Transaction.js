const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    amount: { type: Number, required: true }, // Nombre de Coins demandés
    status: { type: String, default: 'En attente' }, // 'En attente', 'Validé', 'Refusé'
    proofImage: { type: String }, // Nom du fichier image enregistré
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
