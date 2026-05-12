require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

// Import des modèles
const User = require('./models/User');
const Article = require('./models/Article');

const app = express();

// --- CONFIGURATION DES DOSSIERS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// CRITIQUE : Cette ligne permet de charger ton CSS
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONNEXION MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// --- GESTION DES SESSIONS ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'mrdoms_ultra_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES AUTHENTIFICATION ---

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            return res.redirect('/');
        }
        res.render('login', { error: "Identifiants incorrects" });
    } catch (err) {
        res.render('login', { error: "Erreur technique" });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTES DE NAVIGATION ---

// Accueil (Dashboard)
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find().sort({ createdAt: -1 });
        res.render('index', { user, articles, page: 'dashboard' });
    } catch (err) { res.redirect('/login'); }
});

// Pages secondaires (Tarifs, Recharge, etc.)
app.get('/p/:page', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find().sort({ createdAt: -1 });
        res.render('index', { user, articles, page: req.params.page });
    } catch (err) { res.redirect('/'); }
});

// Action : Ajouter un article
app.post('/add-service', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const { title, category, price, description } = req.body;
        await Article.create({ title, category, price: Number(price), description });
        res.redirect('/');
    } catch (err) {
        res.redirect('/p/publier?error=true');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur MR DOM'S lancé`));
