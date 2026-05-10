const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    const produits = [
        { id: 1, nom: "Netflix", prix: 2500 },
        { id: 2, nom: "TikTok", prix: 1500 }
    ];
    
    // Si le dossier views existe, il affiche la page, sinon il affiche un texte
    res.render('index', { user, produits }, (err, html) => {
        if (err) {
            return res.send("Le serveur est OK, mais il ne trouve pas le fichier index.ejs dans le dossier views.");
        }
        res.send(html);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur actif sur le port " + PORT));
