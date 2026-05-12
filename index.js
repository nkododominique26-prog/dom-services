require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// --- SÉCURITÉ MODÈLES ---
let User;
try {
    User = require('./models/User');
    console.log("✅ Modèle User chargé");
} catch (e) {
    console.error("❌ ERREUR : Le fichier models/User.js est manquant ou contient une erreur !");
}

// --- CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNEXION BDD ---
if (!process.env.MONGO_URI) {
    console.error("❌ ERREUR : La variable MONGO_URI est vide sur Render !");
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connecté"))
    .catch(err => console.log("❌ Erreur de connexion BDD :", err.message));

app.use(session({
    secret: 'doms_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES DE DIAGNOSTIC ---

app.get('/login', (req, res) => {
    res.render('login', (err, html) => {
        if (err) {
            console.error("Erreur de vue :", err.message);
            return res.status(500).send(`Erreur : Le fichier <b>views/login.ejs</b> est introuvable. Vérifie ton dossier views sur GitHub.`);
        }
        res.send(html);
    });
});

app.get('/', async (req, res) => {
    try {
        if (!req.session.userId) return res.redirect('/login');
        const user = await User.findById(req.session.userId);
        res.render('index', { user }, (err, html) => {
            if (err) return res.status(500).send(`Erreur : Le fichier <b>views/index.ejs</b> est manquant.`);
            res.send(html);
        });
    } catch (err) {
        res.status(500).send("Erreur de base de données : " + err.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur Mr Dom's sur port ${PORT}`));
