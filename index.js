require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Article = require('./models/Article');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuration du dossier public pour le CSS et les images
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: process.env.SESSION_SECRET || 'doms_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.render('login', { error: "Échec connexion" });
});

app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render('index', { user, articles, page: 'dashboard' });
});

app.get('/p/:page', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render('index', { user, articles, page: req.params.page });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MR DOM'S ONLINE`));
