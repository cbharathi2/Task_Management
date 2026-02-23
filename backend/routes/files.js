const express = require('express');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Upload file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { entityType, entityId } = req.body;

    if (!['task', 'project', 'goal'].includes(entityType)) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_size, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        entityType,
        entityId,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        req.user.id,
      ]
    );

    await connection.release();

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        id: result.insertId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload error', error: err.message });
  }
});

// Get attachments
router.get('/attachments/:entityType/:entityId', verifyToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const connection = await pool.getConnection();

    // For task attachments, check permissions
    if (entityType === 'task') {
      const [tasks] = await connection.query(
        `SELECT t.id, t.assigned_to, t.team_id 
         FROM tasks t
         WHERE t.id = ?`,
        [entityId]
      );

      if (tasks.length === 0) {
        await connection.release();
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = tasks[0];
      const isAssignedToUser = task.assigned_to === userId;
      const isAdmin = userRole === 'admin';

      // Check if user is in the assigned team
      let isInTeam = false;
      if (task.team_id) {
        const [teamMembers] = await connection.query(
          `SELECT id FROM team_members WHERE team_id = ? AND user_id = ?`,
          [task.team_id, userId]
        );
        isInTeam = teamMembers.length > 0;
      }

      // Allow access only if: admin OR assigned user OR team member
      if (!isAdmin && !isAssignedToUser && !isInTeam) {
        await connection.release();
        return res.status(403).json({ message: 'Access denied to this task attachments' });
      }
    }

    // For goal attachments, allow all authenticated employees to access
    if (entityType === 'goal') {
      const [goals] = await connection.query(
        `SELECT g.id FROM goals g WHERE g.id = ?`,
        [entityId]
      );

      if (goals.length === 0) {
        await connection.release();
        return res.status(404).json({ message: 'Goal not found' });
      }
      // Goal attachments are accessible to all authenticated users
    }

    const [attachments] = await connection.query(
      'SELECT id, file_name, file_path, file_size, file_type, created_at FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [entityType, entityId]
    );

    await connection.release();

    res.json({ attachments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete attachment
router.delete('/attachments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    const [attachments] = await connection.query('SELECT file_path FROM attachments WHERE id = ?', [id]);

    if (attachments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete file from disk
    if (fs.existsSync(attachments.file_path)) {
      fs.unlinkSync(attachments.file_path);
    }

    await connection.query('DELETE FROM attachments WHERE id = ?', [id]);
    await connection.release();

    res.json({ message: 'Attachment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Delete error', error: err.message });
  }
});

// Get file content for serving (download)
router.get('/download/:attachmentId', verifyToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const connection = await pool.getConnection();

    // Get attachment info
    const [attachments] = await connection.query(
      'SELECT a.id, a.file_path, a.file_name, a.entity_type, a.entity_id FROM attachments a WHERE a.id = ?',
      [attachmentId]
    );

    if (attachments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const attachment = attachments[0];

    // Check permissions for task attachments
    if (attachment.entity_type === 'task') {
      const [tasks] = await connection.query(
        `SELECT t.id, t.assigned_to, t.team_id FROM tasks t WHERE t.id = ?`,
        [attachment.entity_id]
      );

      if (tasks.length === 0) {
        await connection.release();
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = tasks[0];
      const isAssignedToUser = task.assigned_to === userId;
      const isAdmin = userRole === 'admin';

      let isInTeam = false;
      if (task.team_id) {
        const [teamMembers] = await connection.query(
          `SELECT id FROM team_members WHERE team_id = ? AND user_id = ?`,
          [task.team_id, userId]
        );
        isInTeam = teamMembers.length > 0;
      }

      if (!isAdmin && !isAssignedToUser && !isInTeam) {
        await connection.release();
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check permissions for goal attachments
    if (attachment.entity_type === 'goal') {
      const [goals] = await connection.query(
        `SELECT g.id, g.created_by, g.team_id FROM goals g WHERE g.id = ?`,
        [attachment.entity_id]
      );

      if (goals.length === 0) {
        await connection.release();
        return res.status(404).json({ message: 'Goal not found' });
      }

      const goal = goals[0];
      const isCreator = goal.created_by === userId;
      const isAdmin = userRole === 'admin';

      let isInTeam = false;
      if (goal.team_id) {
        const [teamMembers] = await connection.query(
          `SELECT id FROM team_members WHERE team_id = ? AND user_id = ?`,
          [goal.team_id, userId]
        );
        isInTeam = teamMembers.length > 0;
      }

      if (!isAdmin && !isCreator && !isInTeam) {
        await connection.release();
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await connection.release();

    // Send file as download
    res.download(attachment.file_path, attachment.file_name);
  } catch (err) {
    res.status(500).json({ message: 'Download error', error: err.message });
  }
});

// Get file content for viewing (inline)
router.get('/viewer/:attachmentId', verifyToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const connection = await pool.getConnection();

    // Get attachment info
    const [attachments] = await connection.query(
      'SELECT a.id, a.file_path, a.file_name, a.entity_type, a.entity_id, a.file_type FROM attachments a WHERE a.id = ?',
      [attachmentId]
    );

    if (attachments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const attachment = attachments[0];

    // Check permissions for task attachments
    if (attachment.entity_type === 'task') {
      const [tasks] = await connection.query(
        `SELECT t.id, t.assigned_to, t.team_id FROM tasks t WHERE t.id = ?`,
        [attachment.entity_id]
      );

      if (tasks.length === 0) {
        await connection.release();
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = tasks[0];
      const isAssignedToUser = task.assigned_to === userId;
      const isAdmin = userRole === 'admin';

      let isInTeam = false;
      if (task.team_id) {
        const [teamMembers] = await connection.query(
          `SELECT id FROM team_members WHERE team_id = ? AND user_id = ?`,
          [task.team_id, userId]
        );
        isInTeam = teamMembers.length > 0;
      }

      if (!isAdmin && !isAssignedToUser && !isInTeam) {
        await connection.release();
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check permissions for goal attachments - allow all authenticated users
    if (attachment.entity_type === 'goal') {
      const [goals] = await connection.query(
        `SELECT g.id FROM goals g WHERE g.id = ?`,
        [attachment.entity_id]
      );

      if (goals.length === 0) {
        await connection.release();
        return res.status(404).json({ message: 'Goal not found' });
      }
      // Goal attachments are accessible to all authenticated users
    }

    await connection.release();

    // Send file with appropriate content type for inline viewing
    res.setHeader('Content-Type', attachment.file_type);
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(attachment.file_path);
  } catch (err) {
    res.status(500).json({ message: 'Viewer error', error: err.message });
  }
});

module.exports = router;
