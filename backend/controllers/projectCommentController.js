const pool = require('../config/database');
const { createNotification } = require('./notificationController');

// post a comment on project
const addComment = async (req, res) => {
  const projectId = req.params.id;
  const { message } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO project_comments (project_id, user_id, message) VALUES (?, ?, ?)',
      [projectId, userId, message]
    );

    // notify other party: if employee posted -> notify admin(s); if admin posted -> notify all project members/employees?
    // For simplicity notify all admins when employee posts, and notify project creator (could be admin) or all employees?
    if (userRole === 'employee') {
      // send a notification to all admins
      const [admins] = await connection.query('SELECT id FROM users WHERE role = ?', ['admin']);
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'project_comment',
          entityType: 'project',
          entityId: projectId,
          message: `New comment on project ${projectId}`
        });
      }
    } else {
      // admin posted; notify employees who commented or are assigned? keep it simple: notify all employees with tasks under project
      const [employees] = await connection.query(
        `SELECT DISTINCT t.assigned_to as id FROM tasks t WHERE t.project_id = ? AND t.assigned_to IS NOT NULL`,
        [projectId]
      );
      for (const emp of employees) {
        await createNotification({
          userId: emp.id,
          type: 'project_comment',
          entityType: 'project',
          entityId: projectId,
          message: `Admin replied on project ${projectId}`
        });
      }
    }

    await connection.release();
    res.status(201).json({ message: 'Comment added', commentId: result.insertId });
  } catch (err) {
    console.error('❌ Error adding project comment', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// get comments for project (including nested replies)
const getComments = async (req, res) => {
  const projectId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const [comments] = await connection.query(
      `SELECT pc.*, u.name as user_name, u.role as user_role
       FROM project_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.project_id = ?
       ORDER BY pc.created_at ASC`,
      [projectId]
    );

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const [replies] = await connection.query(
          `SELECT pcr.*, u.name as user_name, u.role as user_role
           FROM project_comment_replies pcr
           JOIN users u ON pcr.user_id = u.id
           WHERE pcr.comment_id = ?
           ORDER BY pcr.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          replies: replies || []
        };
      })
    );

    await connection.release();
    res.json({ comments: commentsWithReplies || [] });
  } catch (err) {
    console.error('❌ Error fetching project comments', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// update a comment
const updateComment = async (req, res) => {
  const projectId = req.params.id;
  const commentId = req.params.commentId;
  const { message } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if the comment exists and user is the owner or admin
    const [comments] = await connection.query(
      'SELECT * FROM project_comments WHERE id = ? AND project_id = ?',
      [commentId, projectId]
    );

    if (comments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = comments[0];
    if (comment.user_id !== userId && userRole !== 'admin') {
      await connection.release();
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    // Update the comment
    await connection.query(
      'UPDATE project_comments SET message = ? WHERE id = ?',
      [message, commentId]
    );

    await connection.release();
    res.json({ message: 'Comment updated' });
  } catch (err) {
    console.error('❌ Error updating comment', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// delete a comment
const deleteComment = async (req, res) => {
  const projectId = req.params.id;
  const commentId = req.params.commentId;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const connection = await pool.getConnection();

    // Check if the comment exists and user is the owner or admin
    const [comments] = await connection.query(
      'SELECT * FROM project_comments WHERE id = ? AND project_id = ?',
      [commentId, projectId]
    );

    if (comments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = comments[0];
    if (comment.user_id !== userId && userRole !== 'admin') {
      await connection.release();
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Delete the comment (replies cascade delete)
    await connection.query(
      'DELETE FROM project_comments WHERE id = ?',
      [commentId]
    );

    await connection.release();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('❌ Error deleting comment', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// add a reply to a comment
const addReply = async (req, res) => {
  const projectId = req.params.id;
  const commentId = req.params.commentId;
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  try {
    const connection = await pool.getConnection();

    // Verify comment exists
    const [comments] = await connection.query(
      'SELECT pc.*, u.name as user_name FROM project_comments pc JOIN users u ON pc.user_id = u.id WHERE pc.id = ? AND pc.project_id = ?',
      [commentId, projectId]
    );

    if (comments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Comment not found' });
    }

    const originalComment = comments[0];

    // Insert reply
    const [result] = await connection.query(
      'INSERT INTO project_comment_replies (comment_id, user_id, message) VALUES (?, ?, ?)',
      [commentId, userId, message]
    );

    // Notify the original comment creator if it's not the current user
    if (originalComment.user_id !== userId) {
      const currentUser = req.user; // Already decoded by verifyToken middleware
      await createNotification({
        userId: originalComment.user_id,
        type: 'comment_reply',
        entityType: 'project',
        entityId: projectId,
        message: `${currentUser.name} replied to your comment`
      });
    }

    await connection.release();
    res.status(201).json({ message: 'Reply added', replyId: result.insertId });
  } catch (err) {
    console.error('❌ Error adding reply', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// delete a reply
const deleteReply = async (req, res) => {
  const projectId = req.params.id;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const connection = await pool.getConnection();

    // Verify the comment exists
    const [comments] = await connection.query(
      'SELECT * FROM project_comments WHERE id = ? AND project_id = ?',
      [commentId, projectId]
    );

    if (comments.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the reply exists and user is the owner or admin
    const [replies] = await connection.query(
      'SELECT * FROM project_comment_replies WHERE id = ? AND comment_id = ?',
      [replyId, commentId]
    );

    if (replies.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Reply not found' });
    }

    const reply = replies[0];
    if (reply.user_id !== userId && userRole !== 'admin') {
      await connection.release();
      return res.status(403).json({ message: 'You can only delete your own replies' });
    }

    // Delete the reply
    await connection.query(
      'DELETE FROM project_comment_replies WHERE id = ?',
      [replyId]
    );

    await connection.release();
    res.json({ message: 'Reply deleted' });
  } catch (err) {
    console.error('❌ Error deleting reply', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  addReply,
  deleteReply,
};