const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, default: 'TikTok' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);
