require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Modèles
const Service = require('./models/Service');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();

// Configuration MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error(err));

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'mon_secret_dom_services_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Middleware pour rendre l'utilisateur disponible dans toutes les vues EJS
app.use(async (req, res, next) => {
    if (req.session.userId) {
        res.locals.user = await User.findById(req.session.userId);
    } else {
        res.locals.user = null;
    }
    next();
});

// Configuration Multer
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

app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashedPassword });
        req.session.userId = newUser._id;
        res.redirect('/');
    } catch (err) {
        res.send("Erreur : Ce nom d'utilisateur est déjà pris.");
    }
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.send("Identifiants incorrects");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTES PROTEGEES ---

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
    await Transaction.create({
        userId: req.session.userId,
        username: res.locals.user.username,
        amount: parseInt(amount),
        proofImage: req.file ? req.file.filename : null
    });
    res.render('confirmation_paiement', { amount });
});

// --- ADMIN ---
app.post('/admin/valider/:id', async (req, res) => {
    const trans = await Transaction.findById(req.params.id);
    if (trans && trans.status === 'En attente') {
        trans.status = 'Validé';
        await trans.save();
        // AJOUT DES COINS AU CLIENT
        await User.findByIdAndUpdate(trans.userId, { $inc: { coins: trans.amount } });
    }
    res.redirect('/admin/transactions');
});

app.get('/admin/transactions', async (req, res) => {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.render('admin_transactions', { transactions });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur actif`));
