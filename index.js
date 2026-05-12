require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Modèles (Assure-toi que les fichiers existent dans le dossier /models)
const User = require('./models/User');

const app = express();

// --- CONFIGURATION CRITIQUE ---
// Ces deux lignes empêchent le retour du "code blanc" après un clic
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'dom_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Middleware pour l'utilisateur
app.use(async (req, res, next) => {
    res.locals.user = null;
    if (req.session.userId) {
        try {
            res.locals.user = await User.findById(req.session.userId);
        } catch (err) { req.session.userId = null; }
    }
    next();
});

// --- ROUTES ---

app.get('/', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('index', { user: res.locals.user });
});

app.get('/register', (req, res) => res.render('register', { error: null }));

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
        if (err.code === 11000) msg = "Ce nom d'utilisateur est déjà pris.";
        res.render('register', { error: msg });
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
    } catch (err) {
        res.render('login', { error: "Erreur serveur." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Live sur port ${PORT}`));
