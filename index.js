const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Base de données temporaire
let services = [
    { name: "Netflix Premium", price: "3000", icon: "📺", category: "streaming" },
    { name: "Boost TikTok", price: "2500", icon: "🚀", category: "social" },
    { name: "IPTV Stable", price: "5000", icon: "🌐", category: "streaming" },
    { name: "Canal+ Web", price: "4500", icon: "📡", category: "streaming" }
];

// Route Accueil
app.get('/', (req, res) => {
    res.render('index', { services: services });
});

// Route Page Vendre
app.get('/vendre', (req, res) => {
    res.render('vendre');
});

// Route pour ajouter un produit
app.post('/ajouter-produit', (req, res) => {
    const { name, price, category } = req.body;
    services.push({
        name: name,
        price: price, // On stocke juste le chiffre
        icon: "📦", 
        category: category
    });
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dom's service lancé sur le port ${PORT}`);
});
