require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Import des modèles
const Service = require('./models/Service');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();

// 1. Configuration du stockage des images (Captures de paiement)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'preuve-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 2. Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD :", err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. ROUTES

// Accueil
app.get('/', async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        const user = { username: "Doms", coins: 304 }; // Simulation utilisateur
        res.render('index', { services, user });
    } catch (err) {
        res.status(500).send("Erreur serveur");
    }
});

// Page de sélection du forfait
app.get('/recharger', (req, res) => {
    const user = { username: "Doms", coins: 304 };
    res.render('recharger', { user });
});

// Page de paiement (Instructions + Envoi de capture)
app.get('/payer/:amount', (req, res) => {
    const amount = req.params.amount;
    const user = { username: "Doms", coins: 304 };
    res.render('paiement', { amount, user });
});

// Action : Recevoir la preuve de paiement
app.post('/soumettre-preuve', upload.single('capture'), async (req, res) => {
    const { amount } = req.body;
    try {
        await Transaction.create({
            userId: "ID_DOMS", // À rendre dynamique avec le système de compte plus tard
            username: "Doms",
            amount: amount,
            proofImage: req.file ? req.file.filename : null
        });
        res.render('confirmation_paiement', { amount });
    } catch (err) {
        res.status(500).send("Erreur lors de l'envoi de la preuve.");
    }
});

// --- SECTION ADMIN (Pour ton équipe) ---
app.get('/admin/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.render('admin_transactions', { transactions });
    } catch (err) {
        res.status(500).send("Erreur admin");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
