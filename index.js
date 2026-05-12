require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Modèles
const User = require('./models/User');
const Article = require('./models/Article');
const Recharge = require('./models/Recharge');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'doms_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- MIDDLEWARE DE PROTECTION ---
const isAdmin = async (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    if (user && user.username === 'Doms') return next();
    res.status(403).send("Accès réservé à l'administrateur.");
};

// --- ROUTES RECHARGE ---

// Page de choix de méthode
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('buy-coins', { user, page: 'buy-coins' });
});

// Envoi de la demande et redirection WhatsApp
app.post('/recharge-request', async (req, res) => {
    const { amount, method } = req.body;
    const user = await User.findById(req.session.userId);
    
    await Recharge.create({
        userId: req.session.userId,
        amount: parseInt(amount),
        method: method
    });

    const message = `Salut Mr Dom's, je viens de recharger ${amount} FCFA via ${method}. Mon pseudo est : ${user.username}. Voici ma preuve :`;
    const whatsappUrl = `https://wa.me/2376XXXXXXXX?text=${encodeURIComponent(message)}`;
    res.redirect(whatsappUrl);
});

// PAGE ADMIN : Voir les recharges en attente
app.get('/admin/recharges', isAdmin, async (req, res) => {
    const user = await User.findById(req.session.userId);
    const pendingRecharges = await Recharge.find({ status: 'En attente' }).populate('userId');
    res.render('admin-recharges', { user, pendingRecharges });
});

// ACTION ADMIN : Valider et libérer l'argent
app.post('/admin/approve-recharge/:id', isAdmin, async (req, res) => {
    try {
        const recharge = await Recharge.findById(req.params.id);
        if (recharge && recharge.status === 'En attente') {
            // Ajouter les coins au solde du client ($inc)
            await User.findByIdAndUpdate(recharge.userId, { $inc: { coins: recharge.amount } });
            // Marquer comme approuvé
            recharge.status = 'Approuvé';
            await recharge.save();
        }
        res.redirect('/admin/recharges');
    } catch (err) { res.send("Erreur de validation"); }
});

// --- AUTRES ROUTES (Résumé) ---
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    const articles = await Article.find({ status: 'Approuvé' }).populate('author').sort({ createdAt: -1 });
    res.render('index', { user, articles, page: 'dashboard' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur actif sur port ${PORT}`));
