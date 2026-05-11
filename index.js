const express = require('express');
const path = require('path');
const app = express();

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Route principale avec données de test
app.get('/', (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    const produits = [
        { id: 1, nom: "Netflix (Test)", prix: 2500 },
        { id: 2, nom: "TikTok (Test)", prix: 1500 }
    ];
    res.render('index', { user, produits });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Serveur de test Dom Services allumé !");
});
