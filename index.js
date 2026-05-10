const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const produits = [
    { id: 1, nom: "Netflix Premium", prix: 2500, image: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
    { id: 2, nom: "1000 Abonnés TikTok", prix: 1500, image: "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" },
    { id: 3, nom: "Carte VCC", prix: 5000, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" }
];

app.get('/', (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    res.render('index', { user: user, produits: produits });
});

app.get('/recharge', (req, res) => { res.render('recharge'); });
app.post('/envoyer-preuve', (req, res) => { res.render('attente'); });

// IMPORTANT POUR RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Dom Services est prêt sur Render !");
});
