require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

// Import du modèle unique pour commencer
const User = require('./models/User');

const app = express();

// --- CONFIGURATION ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONNEXION BDD ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// --- GESTION DES SESSIONS ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'doms_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 24 heures
        secure: process.env.NODE_ENV === 'production' // Sécurité accrue sur Render
    }
}));

// --- ROUTES ---

// Accueil (Dashboard)
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/login');
        
        // On envoie 'user', 'page' et 'articles' (vide) pour éviter les erreurs EJS
        res.render('index', { 
            user: user, 
            page: 'dashboard',
            articles: [] 
        });
    } catch (err) {
        console.error("Erreur Dashboard:", err);
        res.redirect('/login');
    }
});

// Inscription
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Hachage du mot de passe pour la sécurité
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ 
            username, 
            password: hashedPassword,
            balance: 0 // Initialisation du portefeuille à 0
        });
        res.redirect('/login');
    } catch (err) {
        res.render('register', { error: "Cet utilisateur existe déjà." });
    }
});

// Connexion
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            return res.redirect('/');
        }
        res.render('login', { error: "Nom d'utilisateur ou mot de passe incorrect." });
    } catch (err) {
        res.render('login', { error: "Un problème est survenu sur le serveur." });
    }
});

// Déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- DÉMARRAGE ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur Mr Dom's lancé sur le port ${PORT}`);
});
