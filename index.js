require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import du modèle User
const User = require('./models/User');

const app = express();

// --- CONFIGURATION PORT ---
// Crucial pour Render : détecte le port 10000 automatiquement
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNEXION MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connecté à MongoDB"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// --- GESTION DES SESSIONS ---
app.use(session({
    secret: 'dom_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session de 24h
}));

// --- ROUTES AUTHENTIFICATION ---

// Inscription
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            username: username.trim(), 
            password: hashedPassword 
        });
        req.session.userId = newUser._id;
        res.redirect('/');
    } catch (err) {
        // Gère l'erreur si le nom existe déjà
        res.render('register', { error: "Ce nom d'utilisateur est déjà utilisé." });
    }
});

// Connexion
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
            res.render('login', { error: "Identifiants incorrects." });
        }
    } catch (err) {
        res.render('login', { error: "Erreur lors de la connexion." });
    }
});

// Déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTE PRINCIPALE (DASHBOARD) ---
app.get('/', async (req, res) => {
    // Vérifie si l'utilisateur est connecté
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    try {
        // Récupère les infos (dont les coins) pour l'affichage
        const user = await User.findById(req.session.userId);
        res.render('index', { user });
    } catch (err) {
        res.redirect('/login');
    }
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
