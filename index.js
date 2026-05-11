const express = require('express');
const path = require('path');
const axios = require('axios'); // On ajoute axios pour parler au VPS
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// URL de ton serveur sur KermHosting
const VPS_URL = 'http://162.248.100.46:3022'; 

app.get('/', async (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    
    try {
        // Tentative de récupération des vrais articles sur ton VPS
        const response = await axios.get(`${VPS_URL}/articles`, { timeout: 4000 });
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        // Si le VPS ne répond pas, on garde les produits de test pour éviter l'écran noir
        console.log("Connexion VPS impossible, affichage mode secours.");
        const produitsSecours = [
            { id: 1, nom: "Netflix Premium", prix: 2500 },
            { id: 2, nom: "1000 Abonnés TikTok", prix: 1500 }
        ];
        res.render('index', { user: user, produits: produitsSecours });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Dom Services fusionné et prêt sur le port " + PORT);
});
