require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs'); // Ajouté pour vérifier les dossiers
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// --- VERIFICATION DES DOSSIERS (Pour éviter l'erreur EEXIST) ---
const uploadDir = path.join(__dirname, 'public/uploads/proofs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- IMPORT DES MODÈLES ---
const User = require('./models/User');
const Article = require('./models/Article');
const Deposit = require('./models/Deposit');

const app = express();

// --- CONFIGURATION MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Utilise le chemin vérifié plus haut
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- BDD ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

// --- SESSIONS ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'doms_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

// Accueil / Dashboard
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find().sort({ createdAt: -1 });
        res.render('index', { user, articles, page: 'dashboard' });
    } catch (err) { res.redirect('/login'); }
});

// Recharge avec Preuve
app.post('/recharge', upload.single('proof'), async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        await Deposit.create({
            userId: req.session.userId,
            amount: req.body.amount,
            proofImage: `/uploads/proofs/${req.file.filename}`
        });
        res.redirect('/?success=Preuve envoyée');
    } catch (err) { res.redirect('/'); }
});

// Connexion
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.render('login', { error: "Identifiants incorrects" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Plateforme MR DOM'S active`));
