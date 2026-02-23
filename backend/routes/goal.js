const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createGoal,
  getMyGoals,
  getTeamGoals,
  updateGoal,
  deleteGoal
} = require('../controllers/goalController');

const router = express.Router();

router.post('/', verifyToken, createGoal);
router.get('/my', verifyToken, getMyGoals);
router.get('/team', verifyToken, getTeamGoals);
router.put('/:id', verifyToken, updateGoal);
router.delete('/:id', verifyToken, deleteGoal);

module.exports = router;
