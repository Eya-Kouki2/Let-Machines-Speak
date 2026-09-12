const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // --- Authentification de base ---
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Ouvrier'], default: 'Ouvrier' },

  // --- Profil de l'utilisateur ---
  firstName: { type: String, required: true }, // Prénom
  lastName: { type: String, required: false },  // Nom
  age: { 
  type: Number,
  min: [18, "L'âge minimum requis est de 18 ans."] // ✅ Bloque en base de données
},
      // Âge
  yearsOfExperience: { type: Number, default: 0 }, // Années d'expérience
  workZone: { type: String, default: 'Zone A' },  // Zone de travail

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
