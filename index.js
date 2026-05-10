const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Configuration du moteur de rendu (Chemin simplifié pour Render)
app.set('view engine', 'ejs');
app.set('views', './views');

// Configuration des dossiers publics
app.use(express.static('public'));
app.use(express.json());

// URL de ton API sur KermHosting (VPS)
const VPS_URL = 'http://162.248.100.46:3022'; 

// Route principale (Accueil)
app.get('/', async (req, res) => {
    // Infos utilisateur fictives pour le test
    const user = { nom: "Dominique", solde: 2500 };
    
    try {
        // Tentative de récupération des articles sur ton VPS
        const response = await axios.get(`${VPS_URL}/articles`, { timeout: 3000 });
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        // En cas d'erreur ou de VPS éteint, on affiche les produits de secours
        console.log("Connexion VPS échouée, chargement des produits par défaut.");
        const produitsParDefaut = [
            { id: 1, nom: "Netflix Premium", prix: 2500, image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
            { id: 2, nom: "1000 Abonnés TikTok", prix: 1500, image: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" },
            { id: 3, nom: "Compte Canva Pro", prix: 2000, image: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Canva_logo.svg" }
        ];
        res.render('index', { user: user, produits: produitsParDefaut });
    }
});

// Autres pages
app.get('/recharge', (req, res) => { res.render('recharge'); });
app.post('/envoyer-preuve', (req, res) => { res.render('attente'); });

// Lancement du serveur sur le port fourni par Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dom Services tourne sur le port ${PORT}`);
});
