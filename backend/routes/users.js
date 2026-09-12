const express = require('express');
const usersController = require('../controllers/usersController');
const { requireAdmin, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get('/', usersController.listUsers);
router.post('/', usersController.createUser);
router.get('/:id', usersController.getUser);
router.patch('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
