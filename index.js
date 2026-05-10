const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json());

// Route test pour voir si le serveur répond
app.get('/test', (req, res) => {
    res.send("Le serveur fonctionne enfin !");
});

app.get('/', async (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    try {
        const response = await axios.get('http://162.248.100.46:3022/articles', { timeout: 3000 });
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        const produitsParDefaut = [
            { id: 1, nom: "Netflix", prix: 2500, image: "" },
            { id: 2, nom: "TikTok", prix: 1500, image: "" }
        ];
        res.render('index', { user: user, produits: produitsParDefaut });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Serveur actif sur le port " + PORT);
});
