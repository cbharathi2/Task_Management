const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createTask,
  getMyTasks,
  getTasksAssignedByMe,
  updateTask,
  deleteTask,
  getDashboardStats
} = require('../controllers/taskController');

const router = express.Router();

router.post('/', verifyToken, createTask);
router.get('/my', verifyToken, getMyTasks);
router.get('/assigned-by-me', verifyToken, getTasksAssignedByMe);
router.get('/dashboard-stats', verifyToken, getDashboardStats);
router.put('/:id', verifyToken, updateTask);
router.delete('/:id', verifyToken, deleteTask);

module.exports = router;
