const express = require('express');
const app = express();
const path = require('path');

// Configuration d'EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir les fichiers statiques (CSS, Images)
app.use(express.static('public'));

// Données de ton catalogue (Modifie les prix et noms ici)
const services = [
    { name: "Netflix Premium", price: "3000 FCFA", desc: "Compte privé - 1 Mois", icon: "📺" },
    { name: "Boost TikTok", price: "2500 FCFA", desc: "1000 Abonnés réels", icon: "🚀" },
    { name: "IPTV Stable", price: "5000 FCFA", desc: "Plus de 10k chaînes - 1 Mois", icon: "🌐" },
    { name: "Canal+ Web", price: "4500 FCFA", desc: "Accès complet via application", icon: "📡" }
];

// Route principale
app.get('/', (req, res) => {
    res.render('index', { services: services });
});

// Port pour Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
