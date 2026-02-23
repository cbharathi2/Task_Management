const express = require('express');
const { register, login, getUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', verifyToken, getUsers);

module.exports = router;
