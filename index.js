require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Modèles (Vérifie qu'ils sont bien dans le dossier /models)
const User = require('./models/User');
const Article = require('./models/Article');
const Recharge = require('./models/Recharge');

const app = express();

// Configuration
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connexion BDD
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'doms_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

// Accueil (Utilise index.ejs de ton GitHub)
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find({ status: 'Approuvé' }) || [];
        res.render('index', { user, articles });
    } catch (err) { res.status(500).send("Erreur Dashboard"); }
});

// Login (Utilise login.ejs de ton GitHub)
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.send("Identifiants incorrects");
});

// Inscription (Utilise register.ejs de ton GitHub)
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await User.create({ username, password: hashedPassword, coins: 0 });
        res.redirect('/login');
    } catch (e) { res.send("Pseudo déjà pris"); }
});

// Page de recharge (Utilise buy-coins.ejs de ton GitHub)
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('buy-coins', { user });
});

// Admin (Utilise admin-recharges.ejs de ton GitHub)
app.get('/admin/recharges', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user || user.username !== 'Doms') return res.redirect('/');
    const pendingRecharges = await Recharge.find({ status: 'En attente' }).populate('userId');
    res.render('admin-recharges', { user, pendingRecharges });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Mr Dom's actif sur port ${PORT}`));
