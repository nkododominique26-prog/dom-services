require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const Service = require('./models/Service');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'dom_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.error = null;
    if (req.session.userId) {
        try {
            res.locals.user = await User.findById(req.session.userId);
        } catch (err) { req.session.userId = null; }
    }
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'preuve-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- ROUTES AUTHENTIFICATION ---

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            username: username.trim(), 
            password: hashedPassword,
            role: 'client'
        });
        req.session.userId = newUser._id;
        res.redirect('/');
    } catch (err) {
        let msg = "Erreur d'inscription.";
        if (err.code === 11000) msg = "Ce nom d'utilisateur est déjà utilisé.";
        res.render('register', { error: msg });
    }
});

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.trim() });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.render('login', { error: "Identifiants incorrects." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTES SERVICES ---

app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const services = await Service.find().sort({ createdAt: -1 });
    res.render('index', { services });
});

app.get('/recharger', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('recharger');
});

app.get('/payer/:amount', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('paiement', { amount: req.params.amount });
});

app.post('/soumettre-preuve', upload.single('capture'), async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { amount } = req.body;
    try {
        await Transaction.create({
            userId: req.session.userId,
            username: res.locals.user.username,
            amount: parseInt(amount),
            proofImage: req.file ? req.file.filename : null
        });
        res.render('confirmation_paiement', { amount });
    } catch (err) { res.status(500).send("Erreur d'envoi."); }
});

// --- ROUTES ADMIN ---

app.get('/admin/transactions', async (req, res) => {
    if (!res.locals.user || res.locals.user.role !== 'admin') return res.redirect('/');
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.render('admin_transactions', { transactions });
});

app.post('/admin/valider/:id', async (req, res) => {
    if (!res.locals.user || res.locals.user.role !== 'admin') return res.redirect('/');
    try {
        const trans = await Transaction.findById(req.params.id);
        if (trans && trans.status === 'En attente') {
            trans.status = 'Validé';
            await trans.save();
            await User.findByIdAndUpdate(trans.userId, { $inc: { coins: trans.amount } });
        }
        res.redirect('/admin/transactions');
    } catch (err) { res.status(500).send("Erreur de validation."); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur port ${PORT}`));
