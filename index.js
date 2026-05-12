require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 10000;

// Config Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Connexion BDD
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// Sessions
app.use(session({
    secret: 'kermhosting_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username: username.trim() });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            return res.redirect('/');
        }
        res.render('login', { error: "Identifiants incorrects." });
    } catch (err) { res.render('login', { error: "Erreur serveur." }); }
});

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username: username.trim(), password: hashedPassword, coins: 0 });
        req.session.userId = newUser._id;
        res.redirect('/');
    } catch (err) { res.render('register', { error: "Utilisateur déjà existant." }); }
});

app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('index', { user, page: 'dashboard' }); // On passe la variable 'page'
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Écoute sur 0.0.0.0 pour Render
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Live sur port ${PORT}`));
