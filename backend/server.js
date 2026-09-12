const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose'); // ✅ Ajout de mongoose pour se connecter à la base

// Load environment variables (supports .env in backend folder or parent folder)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. Connexion à MongoDB locale ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/let_machines_speak_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connecté avec succès à MongoDB (let_machines_speak_db)'))
  .catch((err) => console.error('❌ Erreur de connexion à MongoDB :', err));

// --- 2. Importation et Liaison des Routes ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes); // ✅ CORRIGÉ ICI : on utilise la variable authRoutes définie juste au-dessus

// Basic Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
