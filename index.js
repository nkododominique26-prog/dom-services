require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// --- DÉTECTION DU CHEMIN DES VUES ---
// Cette ligne force Render à regarder dans le dossier courant
const viewsPath = path.join(__dirname, 'views');
app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- BDD ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ BDD Connectée"))
    .catch(err => console.error("❌ Erreur BDD:", err));

app.use(session({
    secret: 'doms_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- ROUTES ---
app.get('/login', (req, res) => {
    res.render('login', (err, html) => {
        if (err) {
            console.error("Erreur de rendu:", err);
            return res.status(500).send(`Le serveur cherche ici : ${viewsPath}. Vérifie tes dossiers sur GitHub.`);
        }
        res.send(html);
    });
});

app.get('/', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('index');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
