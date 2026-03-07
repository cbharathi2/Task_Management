const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getProjectTasks
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', verifyToken, createProject);
router.get('/', verifyToken, getAllProjects);
router.put('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject);

// tasks under project
router.get('/:id/tasks', verifyToken, getProjectTasks);

// comments under project
const { addComment, getComments, updateComment, deleteComment, addReply, deleteReply } = require('../controllers/projectCommentController');
router.post('/:id/comments', verifyToken, addComment);
router.get('/:id/comments', verifyToken, getComments);
router.put('/:id/comments/:commentId', verifyToken, updateComment);
router.delete('/:id/comments/:commentId', verifyToken, deleteComment);
router.post('/:id/comments/:commentId/replies', verifyToken, addReply);
router.delete('/:id/comments/:commentId/replies/:replyId', verifyToken, deleteReply);

module.exports = router;
