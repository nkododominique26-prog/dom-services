require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Import des modèles
const Service = require('./models/Service');
const User = require('./models/User');

const app = express();

// 1. Connexion à MongoDB Atlas (Utilise ton lien Janise1234 dans Render)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connecté avec succès à MongoDB Atlas"))
    .catch(err => console.error("❌ Erreur de connexion :", err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 2. ROUTES

// --- ACCUEIL / DASHBOARD ---
app.get('/', async (req, res) => {
    try {
        // On récupère les services depuis la base de données
        const services = await Service.find().sort({ createdAt: -1 });
        
        // Utilisateur fictif pour l'instant (On créera le vrai Login après)
        const user = { username: "Doms", coins: 304 }; 
        
        res.render('index', { services, user });
    } catch (err) {
        res.status(500).send("Erreur de chargement du dashboard");
    }
});

// --- PAGE RECHARGER (Option A) ---
app.get('/recharger', (req, res) => {
    const tarifs = [
        { coins: 500, prix: 500, bonus: 0 },
        { coins: 1000, prix: 1000, bonus: 50 },
        { coins: 2000, prix: 2000, bonus: 150 },
        { coins: 5000, prix: 5000, bonus: 500 }
    ];
    const user = { username: "Doms", coins: 304 };
    res.render('recharger', { tarifs, user });
});

// --- PAGE VENDRE (ADMIN) ---
app.get('/vendre', (req, res) => {
    res.render('vendre');
});

// --- ACTION : AJOUTER UN PRODUIT ---
app.post('/ajouter-produit', async (req, res) => {
    const { name, price, category } = req.body;
    
    let icon = "📦";
    if(category === "streaming") icon = "📺";
    if(category === "social") icon = "🚀";
    if(category === "gaming") icon = "🎮";

    try {
        await Service.create({ name, price, category, icon });
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Erreur lors de l'ajout du produit");
    }
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Dom Services est Live sur le port ${PORT}`);
});
