require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// --- IMPORT DES MODÈLES ---
const User = require('./models/User');
const Article = require('./models/Article');
const Deposit = require('./models/Deposit');

const app = express();

// --- CONFIGURATION MULTER (Stockage des preuves) ---
const storage = multer.diskStorage({
    destination: './public/uploads/proofs',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
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

// 1. Dashboard (Interface style KermHosting)
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find().sort({ createdAt: -1 });
        res.render('index', { user, articles, page: 'dashboard' });
    } catch (err) { res.redirect('/login'); }
});

// 2. Achat de service (Déduction de Coins)
app.post('/buy/:id', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const service = await Article.findById(req.params.id);

        if (user.balance >= service.price) {
            user.balance -= service.price;
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            
            user.subscriptions.push({
                serviceName: service.title,
                expiryDate: expiry
            });

            await user.save();
            res.redirect('/?success=Achat validé');
        } else {
            res.redirect('/?error=Coins insuffisants');
        }
    } catch (err) { res.redirect('/'); }
});

// 3. Recharge (Envoi de preuve)
app.post('/recharge', upload.single('proof'), async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        await Deposit.create({
            userId: req.session.userId,
            amount: req.body.amount,
            proofImage: `/uploads/proofs/${req.file.filename}`
        });
        res.redirect('/?success=Preuve envoyée, attente de validation');
    } catch (err) { res.redirect('/'); }
});

// 4. Authentification
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MR DOM'S SaaS OPERATIONNEL`));
