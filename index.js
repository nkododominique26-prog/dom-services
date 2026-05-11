require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

// Modèles
const Service = require('./models/Service');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();

// Configuration de stockage pour les captures d'écran
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- ROUTES ---

app.get('/', async (req, res) => {
    const services = await Service.find().sort({ createdAt: -1 });
    const user = { username: "Doms", coins: 304 }; // À remplacer par req.user plus tard
    res.render('index', { services, user });
});

app.get('/recharger', (req, res) => {
    const user = { username: "Doms", coins: 304 };
    res.render('recharger', { user });
});

// Page de paiement spécifique pour un forfait
app.get('/payer/:amount', (req, res) => {
    const amount = req.params.amount;
    const user = { username: "Doms", coins: 304 };
    res.render('paiement', { amount, user });
});

// Action de soumission de la preuve
app.post('/soumettre-preuve', upload.single('capture'), async (req, res) => {
    const { amount } = req.body;
    try {
        await Transaction.create({
            userId: "ID_DOMS", // À dynamiser plus tard
            username: "Doms",
            amount: amount,
            price: amount, // Si 1 Coin = 1 FCFA
            proofImage: req.file ? req.file.filename : ''
        });
        res.render('confirmation_paiement');
    } catch (err) {
        res.status(500).send("Erreur lors de l'envoi");
    }
});

// --- ADMIN : VOIR LES DEMANDES ---
app.get('/admin/transactions', async (req, res) => {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.render('admin_transactions', { transactions });
});

app.listen(process.env.PORT || 3000);
