require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Modèles
const User = require('./models/User');
const Article = require('./models/Article');
const Recharge = require('./models/Recharge');

const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURATION CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mr_doms_recharges',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connecté"))
    .catch(err => console.error("❌ Erreur MongoDB:", err));

// Configuration Session
app.use(session({
    secret: 'doms_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24h
}));

// --- ROUTES CLIENTS ---

// Dashboard Principal
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find({ status: 'Approuvé' }).populate('author').sort({ createdAt: -1 });
        res.render('index', { user, articles, page: 'dashboard' });
    } catch (err) { res.redirect('/login'); }
});

// Page de Recharge
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('buy-coins', { user });
});

// Envoi de la preuve (POST)
app.post('/recharge-request', upload.single('proof'), async (req, res) => {
    try {
        const { amount, method } = req.body;
        if (!req.file) return res.send("Veuillez joindre une preuve de paiement.");

        await Recharge.create({
            userId: req.session.userId,
            amount: parseInt(amount),
            method: method,
            proofImage: req.file.path // URL sécurisée Cloudinary
        });

        res.render('recharge-success');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de l'envoi de la demande.");
    }
});

// --- ROUTES ADMIN (Accès restreint à 'Doms') ---

app.get('/admin/recharges', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user || user.username !== 'Doms') return res.redirect('/');
    
    const pendingRecharges = await Recharge.find({ status: 'En attente' }).populate('userId');
    res.render('admin-recharges', { user, pendingRecharges });
});

app.post('/admin/approve-recharge/:id', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user || user.username !== 'Doms') return res.status(403).send("Refusé");

    try {
        const recharge = await Recharge.findById(req.params.id);
        if (recharge && recharge.status === 'En attente') {
            // Créditer le compte du client
            await User.findByIdAndUpdate(recharge.userId, { $inc: { coins: recharge.amount } });
            // Valider la transaction
            recharge.status = 'Approuvé';
            await recharge.save();
        }
        res.redirect('/admin/recharges');
    } catch (err) { res.status(500).send("Erreur de validation."); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mr Dom's Online on Port ${PORT}`);
});
