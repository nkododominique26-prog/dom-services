require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import des modèles
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 10000; // Correction port Render

// Middlewares vitaux
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Base de données connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// Configuration des Sessions (Indispensable pour rester connecté)
app.use(session({
    secret: 'kerm_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Garde la session 24h
}));

// --- ROUTES AUTHENTIFICATION ---

// Page Inscription
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            username: username.trim(), 
            password: hashedPassword,
            coins: 0 // Solde initial
        });
        req.session.userId = newUser._id;
        res.redirect('/');
    } catch (err) {
        res.render('register', { error: "Utilisateur déjà existant." });
    }
});

// Page Connexion
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username.trim() });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            res.redirect('/');
        } else {
            res.render('login', { error: "Nom ou mot de passe incorrect." });
        }
    } catch (err) {
        res.render('login', { error: "Erreur de connexion." });
    }
});

// Déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTES DASHBOARD (STYLE KERMHOSTING) ---

app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        // On affiche le dashboard avec les données utilisateur
        res.render('index', { user, page: 'dashboard' });
    } catch (err) {
        res.redirect('/login');
    }
});

// Route Tarifs
app.get('/tarifs', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('index', { user, page: 'tarifs' });
});

// Route Acheter des coins
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('index', { user, page: 'buy-coins' });
});

// Lancement du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur KermStyle actif sur le port ${PORT}`);
});
