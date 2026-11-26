const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { requireAuth } = require('../middleware/authMiddleware');

// Route pour l'inscription
router.post('/signup', authController.signUp);

// Route pour la connexion
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/me', requireAuth, authController.me);

module.exports = router;

