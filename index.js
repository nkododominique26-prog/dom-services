require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// --- CONFIGURATION DES CHEMINS ---
// On utilise path.resolve pour être sûr que Render trouve le dossier views
const viewsPath = path.resolve(__dirname, 'views');
app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(express.static(path.resolve(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONNEXION BDD ---
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

// --- MODÈLES ---
const User = require('./models/User');

// --- ROUTES ---

app.get('/login', (req, res) => {
    // On teste si le fichier existe avant de l'afficher
    res.render('login', (err, html) => {
        if (err) {
            return res.status(500).send(`Erreur de rendu : Le serveur cherche dans ${viewsPath}. Vérifie que login.ejs est bien dedans.`);
        }
        res.send(html);
    });
});

app.get('/', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('index');
});

// Garde tes routes POST pour le login et register ici...

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
