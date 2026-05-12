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

const app = express();

// --- CONFIGURATION ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONNEXION BDD ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// --- SESSIONS ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'mrdoms_2026_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES DE NAVIGATION ---

// Route unique pour gérer tous les affichages
app.get('/:page?', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    
    const currentPage = req.params.page || 'dashboard';
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find().sort({ createdAt: -1 });

        res.render('index', { 
            user: user, 
            articles: articles, 
            page: currentPage 
        });
    } catch (err) {
        res.redirect('/login');
    }
});

// Route pour ajouter un service
app.post('/add-service', async (req, res) => {
    try {
        const { title, category, price, description } = req.body;
        await Article.create({ title, category, price, description });
        res.redirect('/');
    } catch (err) {
        res.redirect('/?error=Echec');
    }
});

// Authentification
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.redirect('/login');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MR DOM'S ONLINE`));
