const express = require('express');
const usersController = require('../controllers/usersController');
const { requireAdmin, requireAuth } = require('../middleware/authMiddleware');
const { upload } = require('../config/upload');

const router = express.Router();

router.get('/me', requireAuth, usersController.getCurrentUser);
router.patch('/me', requireAuth, usersController.updateCurrentUser);
router.patch('/me/password', requireAuth, usersController.changePassword);
router.post('/me/avatar', requireAuth, upload.single('avatar'), usersController.uploadAvatar);

router.use(requireAuth, requireAdmin);
router.get('/', usersController.listUsers);
router.post('/', usersController.createUser);
router.get('/:id', usersController.getUser);
router.patch('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
