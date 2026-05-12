require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

// Importation des modèles
const User = require('./models/User');
const Article = require('./models/Article'); 

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
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

// --- ROUTES ---

// 1. Dashboard : Affiche les derniers articles publiés
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        // On récupère les vrais articles de la base de données
        const articles = await Article.find().sort({ createdAt: -1 });
        
        res.render('index', { 
            user: user, 
            page: 'dashboard',
            articles: articles 
        });
    } catch (err) {
        res.redirect('/login');
    }
});

// 2. Route pour publier un article (POST)
app.post('/publier-article', async (req, res) => {
    if (!req.session.userId) return res.status(401).send("Non autorisé");
    try {
        const { title, description, price, category } = req.body;
        await Article.create({ title, description, price, category });
        res.redirect('/'); // Redirige vers l'accueil pour voir l'article
    } catch (err) {
        res.status(500).send("Erreur lors de la publication");
    }
});

// 3. Authentification
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.redirect('/login');
    } catch (err) {
        res.render('register', { error: "Utilisateur déjà existant" });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.render('login', { error: "Identifiants incorrects" });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MR DOM'S EN LIGNE`));
