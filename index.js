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

// --- CONFIGURATION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connecté à MongoDB"))
    .catch(err => console.error("❌ Erreur MongoDB:", err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Indispensable pour lire les données des formulaires
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration des sessions
app.use(session({
    secret: 'dom_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 heures
}));

// Middleware pour rendre l'utilisateur accessible dans toutes les pages EJS
app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.error = null;
    if (req.session.userId) {
        try {
            res.locals.user = await User.findById(req.session.userId);
        } catch (err) {
            req.session.userId = null;
        }
    }
    next();
});

// --- ROUTES AUTHENTIFICATION ---

// Page d'inscription (Affiche le formulaire)
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Traitement de l'inscription (Quand on clique sur le bouton)
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
        let msg = "Erreur d'inscription.";
        if (err.code === 11000) msg = "Ce nom d'utilisateur est déjà utilisé.";
        res.render('register', { error: msg });
    }
});

// Page de connexion
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
        res.render('login', { error: "Erreur de connexion." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTE ACCUEIL (DASHBOARD) ---
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    // On passe l'utilisateur à la vue
    res.render('index', { user: res.locals.user });
});

// --- LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
