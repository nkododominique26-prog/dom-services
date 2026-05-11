const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 0 },
    role: { type: String, default: 'client' }, // 'client' ou 'admin'
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
