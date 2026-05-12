const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Recharge = require('./models/Recharge');

// Configuration Cloudinary avec tes clés
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// Setup du stockage Cloud
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mr_doms_recharges',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. Page de recharge client
app.get('/buy-coins', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    res.render('buy-coins', { user });
});

// 2. Traitement de la preuve
app.post('/recharge-request', upload.single('proof'), async (req, res) => {
    try {
        const { amount, method } = req.body;
        if (!req.file) return res.send("Erreur : Image manquante.");

        await Recharge.create({
            userId: req.session.userId,
            amount: parseInt(amount),
            method: method,
            proofImage: req.file.path
        });
        res.render('recharge-success');
    } catch (err) { res.status(500).send("Erreur serveur."); }
});

// 3. Admin : Liste des recharges
app.get('/admin/recharges', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (user.username !== 'Doms') return res.redirect('/');
    const pendingRecharges = await Recharge.find({ status: 'En attente' }).populate('userId');
    res.render('admin-recharges', { user, pendingRecharges });
});

// 4. Admin : Validation finale
app.post('/admin/approve-recharge/:id', async (req, res) => {
    const recharge = await Recharge.findById(req.params.id);
    if (recharge && recharge.status === 'En attente') {
        await User.findByIdAndUpdate(recharge.userId, { $inc: { coins: recharge.amount } });
        recharge.status = 'Approuvé';
        await recharge.save();
    }
    res.redirect('/admin/recharges');
});
