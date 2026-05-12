require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const multer = require('multer'); // Pour l'envoi des preuves de paiement

// Modèles
const User = require('./models/User');
const Article = require('./models/Article');
const Deposit = require('./models/Deposit');

const app = express();

// --- CONFIGURATION MULTER (Stockage preuves) ---
const storage = multer.diskStorage({
    destination: './public/uploads/proofs',
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

// --- ROUTES CLIENTS ---

// Dashboard (Affichage solde et services)
app.get('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const articles = await Article.find().sort({ createdAt: -1 });
        res.render('index', { user, articles, page: 'dashboard' });
    } catch (err) { res.redirect('/login'); }
});

// Achat d'un service avec les Coins
app.post('/buy-service/:id', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        const user = await User.findById(req.session.userId);
        const service = await Article.findById(req.params.id);

        if (user.balance >= service.price) {
            user.balance -= service.price;
            
            // Calcul expiration (30 jours)
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            
            user.subscriptions.push({
                serviceName: service.title,
                expiryDate: expiry,
                status: 'active'
            });

            await user.save();
            res.redirect('/?success=Achat réussi');
        } else {
            res.redirect('/?error=Solde insuffisant');
        }
    } catch (err) { res.redirect('/'); }
});

// Envoi d'une preuve de recharge
app.post('/recharge', upload.single('proof'), async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    try {
        await Deposit.create({
            userId: req.session.userId,
            amount: req.body.amount,
            proofImage: `/uploads/proofs/${req.file.filename}`,
            status: 'en_attente'
        });
        res.redirect('/?success=Preuve envoyée, attendez la validation');
    } catch (err) { res.redirect('/'); }
});

// --- ROUTES ADMIN ---

// Liste des recharges à valider
app.get('/admin/deposits', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (user.role !== 'admin') return res.redirect('/');
    
    const deposits = await Deposit.find({ status: 'en_attente' }).populate('userId');
    res.render('admin_deposits', { user, deposits });
});

// Validation d'un dépôt par l'admin
app.post('/admin/validate/:id', async (req, res) => {
    const userAdmin = await User.findById(req.session.userId);
    if (userAdmin.role !== 'admin') return res.status(403).send("Interdit");

    try {
        const deposit = await Deposit.findById(req.params.id);
        const client = await User.findById(deposit.userId);

        client.balance += deposit.amount;
        deposit.status = 'valide';

        await client.save();
        await deposit.save();
        res.redirect('/admin/deposits');
    } catch (err) { res.redirect('/admin/deposits'); }
});

// --- AUTH ---
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.redirect('/');
    }
    res.render('login', { error: "Erreur d'identification" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Plateforme MR DOM'S active`));
