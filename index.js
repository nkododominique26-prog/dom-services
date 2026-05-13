require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

const app = express();

// ---------------- CONFIG ----------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------- DATABASE ----------------

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connecté"))
.catch((err) => console.log("❌ Erreur MongoDB :", err));

// ---------------- SESSIONS ----------------

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),

    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: false
    }
}));

// ---------------- MIDDLEWARE ----------------

function isAuthenticated(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// ---------------- ROUTES ----------------

// Home
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.redirect('/login');
        }

        res.render('index', {
            user,
            page: 'dashboard',
            articles: []
        });

    } catch (err) {
        console.log(err);
        res.redirect('/login');
    }
});

// Register
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('register', {
                error: "Tous les champs sont requis"
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.render('register', {
                error: "Utilisateur déjà existant"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            password: hashedPassword
        });

        res.redirect('/login');

    } catch (err) {

        console.log(err);

        res.render('register', {
            error: "Erreur serveur"
        });
    }
});

// Login
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {

    try {

        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.render('login', {
                error: "Utilisateur introuvable"
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.render('login', {
                error: "Mot de passe incorrect"
            });
        }

        req.session.userId = user._id;

        res.redirect('/');

    } catch (err) {

        console.log(err);

        res.render('login', {
            error: "Erreur serveur"
        });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// ---------------- SERVER ----------------

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
