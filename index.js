const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Configuration du moteur de rendu
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques (images, CSS)
app.use(express.static('public'));
app.use(express.json());

// URL de ton serveur de stockage KermHosting
const VPS_URL = 'http://162.248.100.46:3022'; 

// Route principale
app.get('/', async (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    
    try {
        // On essaie de récupérer les articles du VPS
        const response = await axios.get(`${VPS_URL}/articles`);
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        // Si le VPS ne répond pas, on utilise cette liste de secours (SANS ESPACE)
        const produitsParDefaut = [
            { id: 1, nom: "Netflix Premium", prix: 2500, image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
            { id: 2, nom: "1000 Abonnés TikTok", prix: 1500, image: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" },
            { id: 3, nom: "Carte VCC", prix: 5000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" }
        ];
        console.log("Note: Connexion au VPS impossible, affichage des produits par défaut.");
        res.render('index', { user: user, produits: produitsParDefaut });
    }
});

// Routes pour les autres pages
app.get('/recharge', (req, res) => { res.render('recharge'); });
app.post('/envoyer-preuve', (req, res) => { res.render('attente'); });

// Lancement du serveur sur Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dom Services est prêt sur le port ${PORT} !`);
});
