const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getNotifications, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;