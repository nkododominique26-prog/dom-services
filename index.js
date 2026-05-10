const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
    // On met des données fixes pour être SÛR que ça affiche l'interface
    const user = { nom: "Dominique", solde: 2500 };
    const produits = [
        { id: 1, nom: "Service Test", prix: 1000 }
    ];
    res.render('index', { user, produits });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Serveur lancé sur le port " + PORT);
});
