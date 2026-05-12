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

// Import des modèles (Vérifie bien que ces fichiers existent dans /models)
const User = require('./models/User');
const Article = require('./models/Article');
const Recharge = require('./models/Recharge');

const app = express();

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'mr_doms_recharges', allowed_formats: ['jpg', 'png', 'jpeg'] }
});
const upload = multer({ storage: storage });

// Configuration Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.log("❌ Erreur BDD:", err));

app.use(session({
    secret: 'doms_secret_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---

app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find({ status: 'Approuvé' }).populate('author') || [];
        res.render('index', { user, articles });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur de chargement du dashboard (Vérifie le fichier views/index.ejs)");
    }
});

app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
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
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, coins: 0 });
        res.redirect('/login');
    } catch (e) { res.send("Erreur : Ce pseudo est déjà utilisé"); }
});

app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        res.render('buy-coins', { user });
    } catch (e) { res.status(500).send("Erreur page recharge"); }
});

app.post('/recharge-request', upload.single('proof'), async (req, res) => {
    try {
        if (!req.file) return res.send("Erreur : Image manquante.");
        await Recharge.create({
            userId: req.session.userId,
            amount: req.body.amount,
            method: req.body.method,
            proofImage: req.file.path
        });
        res.render('recharge-success');
    } catch (e) { res.status(500).send("Erreur lors de l'envoi"); }
});

// Port de Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur sur port ${PORT}`));
