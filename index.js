require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// --- VÉRIFICATION DES MODÈLES ---
// Ces noms doivent correspondre exactement à tes fichiers dans /models
let User, Article, Recharge;
try {
    User = require('./models/User');
    Article = require('./models/Article');
    Recharge = require('./models/Recharge');
} catch (e) {
    console.error("❌ Erreur : Fichier modèle manquant dans /models");
}

// --- CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNEXION MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connecté"))
    .catch(err => console.error("❌ Erreur BDD:", err.message));

app.use(session({
    secret: 'doms_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

// Accueil
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find({ status: 'Approuvé' }) || [];
        res.render('index', { user, articles });
    } catch (err) {
        res.status(500).send("Erreur de chargement du Dashboard : " + err.message);
    }
});

// Login
app.get('/login', (req, res) => {
    res.render('login', (err, html) => {
        if (err) return res.status(500).send("Le fichier views/login.ejs est introuvable sur Render.");
        res.send(html);
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            return res.redirect('/');
        }
        res.send("Identifiants incorrects. <a href='/login'>Réessayer</a>");
    } catch (e) { res.status(500).send("Erreur système"); }
});

// Register
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, coins: 0 });
        res.redirect('/login');
    } catch (e) { res.send("Erreur : Ce pseudo existe déjà."); }
});

// Recharge
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('buy-coins', { user });
});

// --- DÉMARRAGE ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mr Dom's est Live sur le port ${PORT}`);
});
