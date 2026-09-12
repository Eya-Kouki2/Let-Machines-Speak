const User = require('../models/user');

// ==========================
// SIGN UP
// ==========================
exports.signUp = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      age,
      yearsOfExperience,
      workZone
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé."
      });
    }

    // Vérifier si c'est un ouvrier
    const isWorker = role === "Ouvrier";

    // Créer le nouvel utilisateur
    const newUser = new User({
      email,
      password,
      role,
      firstName,
      lastName,

      age: isWorker ? age : undefined,
      yearsOfExperience: isWorker ? yearsOfExperience : undefined,
      workZone: isWorker ? workZone : undefined
    });

    // Sauvegarder dans MongoDB
    await newUser.save();

    res.status(201).json({
      message: "Utilisateur créé avec succès !",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });

  } catch (error) {
    console.error("Erreur signup :", error);

    res.status(500).json({
      message: "Erreur lors de l'inscription.",
      error: error.message
    });
  }
};


// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Chercher l'utilisateur dans MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect."
      });
    }

    // Vérifier le mot de passe
    if (user.password !== password) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect."
      });
    }

    // Token temporaire
    const token = "session-token-id-" + user._id;

    // Réponse envoyée au frontend
    res.status(200).json({
      message: "Connexion réussie !",
      token,

      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Erreur login :", error);

    res.status(500).json({
      message: "Erreur serveur lors de la connexion.",
      error: error.message
    });
  }
};