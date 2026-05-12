require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// --- CONFIGURATION DES VUES ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONNEXION À LA BASE DE DONNÉES ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée avec succès"))
    .catch(err => console.error("❌ Erreur BDD :", err.message));

// --- GESTION DES SESSIONS ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'mr_doms_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 jour
}));

// --- ROUTES ---

// Route Login (CORRIGÉE : envoie 'error: null' pour éviter le plantage EJS)
app.get('/login', (req, res) => {
    res.render('login', { error: null }); 
});

// Route d'accueil
app.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('index', { user: req.session.userId });
});

// Route POST Login (Exemple de base)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Ici tu ajouteras ta logique avec ton modèle User
        // Pour l'instant, si ça échoue, on renvoie l'erreur au fichier EJS
        res.render('login', { error: "Identifiants incorrects" });
    } catch (err) {
        res.render('login', { error: "Erreur serveur" });
    }
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur opérationnel sur le port ${PORT}`);
});
