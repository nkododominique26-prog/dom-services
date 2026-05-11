require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Import des modèles (Assure-toi que ces fichiers existent dans ton dossier /models)
const Service = require('./models/Service');
const User = require('./models/User');

const app = express();

// 1. Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connecté à MongoDB Atlas"))
    .catch(err => console.error("❌ Erreur de connexion MongoDB :", err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Route Accueil (Récupère les services depuis la BDD)
app.get('/', async (req, res) => {
    try {
        // On va chercher tous les services enregistrés dans MongoDB
        const services = await Service.find().sort({ createdAt: -1 });
        
        // On simule un utilisateur "Doms" pour le design
        const user = { username: "Doms", coins: 304 }; 
        
        res.render('index', { services, user });
    } catch (err) {
        res.status(500).send("Erreur lors de la récupération des services");
    }
});

// 3. Route Page Vendre
app.get('/vendre', (req, res) => {
    res.render('vendre');
});

// 4. Route Action Ajouter (Enregistre dans la BDD)
app.post('/ajouter-produit', async (req, res) => {
    const { name, price, category } = req.body;
    
    // Choix de l'icône selon la catégorie
    let icon = "📦";
    if(category === "streaming") icon = "📺";
    if(category === "social") icon = "🚀";
    if(category === "gaming") icon = "🎮";

    try {
        // ICI : On enregistre réellement dans MongoDB
        await Service.create({ name, price, category, icon });
        console.log(`✅ Article ajouté : ${name}`);
        res.redirect('/');
    } catch (err) {
        console.error("❌ Erreur d'enregistrement :", err);
        res.status(500).send("Erreur lors de l'enregistrement de l'article");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
