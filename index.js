const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
    // On ignore le VPS pour ce test, on affiche juste pour voir si ça marche
    res.render('index', { 
        user: { nom: "Dominique", solde: 2500 },
        produits: [
            { id: 1, nom: "Test Connexion", prix: 0 }
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Serveur de test en ligne sur le port " + PORT);
});
