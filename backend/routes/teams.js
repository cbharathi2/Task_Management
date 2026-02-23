const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createTeam,
  getTeams,
  getTeamDetails,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
} = require('../controllers/teamController');

const router = express.Router();

router.post('/', verifyToken, createTeam);
router.get('/', verifyToken, getTeams);
router.get('/:id', verifyToken, getTeamDetails);
router.put('/:id', verifyToken, updateTeam);
router.delete('/:id', verifyToken, deleteTeam);
router.post('/:id/members', verifyToken, addTeamMember);
router.delete('/:id/members', verifyToken, removeTeamMember);

module.exports = router;
