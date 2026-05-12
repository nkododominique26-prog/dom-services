require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Modèles
const User = require('./models/User');
const Article = require('./models/Article');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'doms_ultra_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES AUTH ---
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.trim() });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.render('login', { error: "Identifiants incorrects." });
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

// --- DASHBOARD (Articles Approuvés Uniquement) ---
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    // On ne récupère que les articles avec status "Approuvé"
    const articles = await Article.find({ status: 'Approuvé' }).populate('author').sort({ createdAt: -1 });
    res.render('index', { user, articles, page: 'dashboard' });
});

// --- PUBLICATION ---
app.get('/post-article', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('post-article', { user });
});

app.post('/post-article', async (req, res) => {
    const { title, content, price } = req.body;
    await Article.create({ title, content, price, author: req.session.userId });
    res.redirect('/'); // L'article est créé en "En attente" par défaut
});

// --- ADMIN (Validation) ---
app.get('/admin/articles', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    
    // Vérifie que c'est bien toi (Doms)
    if (user.username !== 'Doms') return res.status(403).send("Accès réservé à l'admin.");

    const pendingArticles = await Article.find({ status: 'En attente' }).populate('author');
    res.render('admin-articles', { user, pendingArticles });
});

app.post('/admin/approve/:id', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (user.username !== 'Doms') return res.status(403).send("Non autorisé.");
    
    await Article.findByIdAndUpdate(req.params.id, { status: 'Approuvé' });
    res.redirect('/admin/articles');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur actif sur port ${PORT}`));
