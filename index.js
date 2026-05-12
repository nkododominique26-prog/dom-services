require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import du modèle User (Vérifie que le dossier 'models' existe sur GitHub)
const User = require('./models/User');

const app = express();

// --- CONFIGURATION PORT POUR RENDER ---
// Render utilise le port 10000 par défaut, ce code permet de le détecter
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'dom_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// --- ROUTES ---

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username: username.trim(), password: hashedPassword });
        res.redirect('/login');
    } catch (err) {
        res.render('register', { error: "Nom déjà pris ou erreur BDD." });
    }
});

app.get('/login', (req, res) => res.render('login', { error: null }));

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
    } catch (err) { res.render('login', { error: "Erreur serveur." }); }
});

app.get('/', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.send("<h1>Bienvenue sur votre espace Dom's Services !</h1>");
});

// ÉCOUTE SUR LE PORT DÉTECTÉ
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur actif sur le port ${PORT}`);
});
