require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

// Import des modèles
const User = require('./models/User');
const Article = require('./models/Article');
const Deposit = require('./models/Deposit');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: process.env.SESSION_SECRET || 'doms_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES POUR CHAQUE MENU ---

// 1. Dashboard (Accueil)
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render('index', { user, articles, page: 'dashboard' });
});

// 2. Liste des Tarifs
app.get('/tarifs', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    const articles = await Article.find();
    res.render('index', { user, articles, page: 'tarifs' });
});

// 3. Acheter Coins (Recharge)
app.get('/recharge', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('index', { user, page: 'recharge', articles: [] });
});

// 4. Publier Article (Formulaire admin)
app.get('/publier', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('index', { user, page: 'publier', articles: [] });
});

// 5. Admin Approbation (Validation des paiements)
app.get('/approbation', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    const deposits = await Deposit.find({ status: 'en_attente' }).populate('userId');
    res.render('index', { user, deposits, page: 'approbation', articles: [] });
});

// --- ACTIONS (POST) ---

app.post('/add-service', async (req, res) => {
    const { title, category, price, description } = req.body;
    await Article.create({ title, category, price, description });
    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.redirect('/login');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MR DOM'S opérationnel`));
