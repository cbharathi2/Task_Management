const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', verifyToken, createProject);
router.get('/', verifyToken, getAllProjects);
router.put('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject);

module.exports = router;
