const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));
app.use(express.json());

const VPS_URL = 'http://162.248.100.46:3022'; 

app.get('/', async (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    try {
        const response = await axios.get(`${VPS_URL}/articles`, { timeout: 3000 });
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        const produitsParDefaut = [
            { id: 1, nom: "Netflix Premium", prix: 2500, image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
            { id: 2, nom: "1000 Abonnés TikTok", prix: 1500, image: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" }
        ];
        res.render('index', { user: user, produits: produitsParDefaut });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur prêt sur le port ${PORT}`);
});
