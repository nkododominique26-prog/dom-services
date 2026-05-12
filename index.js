require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// --- VERIFICATION DES MODÈLES ---
// Assure-toi que ces fichiers existent dans ton dossier /models
const User = require('./models/User');
const Article = require('./models/Article');
const Recharge = require('./models/Recharge');

const app = express();

// --- CONFIGURATION CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mr_doms_recharges',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNEXION BDD ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'doms_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

// Accueil
app.get('/', async (req, res) => {
    try {
        if (!req.session.userId) return res.redirect('/login');
        const user = await User.findById(req.session.userId);
        const articles = await Article.find({ status: 'Approuvé' }).populate('author') || [];
        res.render('index', { user, articles });
    } catch (err) {
        res.status(500).send("Erreur de chargement du Dashboard");
    }
});

// Login / Register
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            return res.redirect('/');
        }
        res.send("Identifiants incorrects");
    } catch (e) { res.status(500).send("Erreur Login"); }
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, coins: 0 });
        res.redirect('/login');
    } catch (e) { res.send("Erreur : Pseudo déjà utilisé"); }
});

// Recharge
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('buy-coins', { user });
});

app.post('/recharge-request', upload.single('proof'), async (req, res) => {
    try {
        if (!req.file) return res.send("Veuillez envoyer une image.");
        await Recharge.create({
            userId: req.session.userId,
            amount: req.body.amount,
            method: req.body.method,
            proofImage: req.file.path
        });
        res.render('recharge-success');
    } catch (e) { res.status(500).send("Erreur lors de l'upload"); }
});

// Admin
app.get('/admin/recharges', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user || user.username !== 'Doms') return res.redirect('/');
    const pendingRecharges = await Recharge.find({ status: 'En attente' }).populate('userId');
    res.render('admin-recharges', { user, pendingRecharges });
});

app.post('/admin/approve-recharge/:id', async (req, res) => {
    try {
        const recharge = await Recharge.findById(req.params.id);
        if (recharge && recharge.status === 'En attente') {
            await User.findByIdAndUpdate(recharge.userId, { $inc: { coins: recharge.amount } });
            recharge.status = 'Approuvé';
            await recharge.save();
        }
        res.redirect('/admin/recharges');
    } catch (e) { res.status(500).send("Erreur Admin"); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
