const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Liste des services initiale (Boutique Dom's service)
let services = [
    { name: "Netflix Premium", price: "3000 Coins", icon: "📺", category: "streaming" },
    { name: "Boost TikTok", price: "2500 Coins", icon: "🚀", category: "social" },
    { name: "IPTV Stable", price: "5000 Coins", icon: "🌐", category: "streaming" },
    { name: "Canal+ Web", price: "4500 Coins", icon: "📡", category: "streaming" }
];

// Route Accueil
app.get('/', (req, res) => {
    res.render('index', { services: services });
});

// Route Page Vendre
app.get('/vendre', (req, res) => {
    res.render('vendre');
});

// Logique pour ajouter un produit depuis le formulaire
app.post('/ajouter-produit', (req, res) => {
    const { name, price, category } = req.body;
    
    // On ajoute le nouveau service à la liste avec une icône par défaut
    services.push({
        name: name,
        price: price + " Coins",
        icon: "📦", 
        category: category
    });

    // Redirection vers l'accueil pour voir le résultat
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
