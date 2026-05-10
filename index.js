const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Configuration visuelle
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());

// Ton lien VPS KermHosting
const VPS_URL = 'http://162.248.100.46:3022'; 

app.get('/', async (req, res) => {
    const user = { nom: "Dominique", solde: 2500 };
    
    try {
        // Tentative de fusion avec le VPS
        const response = await axios.get(`${VPS_URL}/articles`, { timeout: 3000 });
        res.render('index', { user: user, produits: response.data });
    } catch (error) {
        // Si le VPS est éteint ou refuse la fusion, on affiche ceci par défaut
        console.log("Note: VPS non joint, affichage du mode secours.");
        const produitsSecours = [
            { id: 1, nom: "Netflix Premium", prix: 2500 },
            { id: 2, nom: "1000 Abonnés TikTok", prix: 1500 }
        ];
        res.render('index', { user: user, produits: produitsSecours });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dom Services est en ligne sur le port ${PORT}`);
});
