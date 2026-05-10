const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());

const VPS_URL = 'http://162.248.100.46:3022'; 

app.get('/', async (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    try {
        const response = await axios.get(`${VPS_URL}/articles`);
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        // Produits par défaut si le VPS ne répond pas
        const produits ParDefaut = [
            { id: 1, nom: "Netflix Premium", prix: 2500 },
            { id: 2, nom: "1000 Abonnés TikTok", prix: 1500 }
        ];
        res.render('index', { user: user, produits: produitsParDefaut });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Dom Services lancé sur le port ${PORT}`);
});
