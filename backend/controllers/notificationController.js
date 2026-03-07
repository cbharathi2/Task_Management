const pool = require('../config/database');

// fetch notifications for current user
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    await connection.release();
    res.json({ notifications: rows || [] });
  } catch (err) {
    console.error('❌ Error fetching notifications', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// delete a notification (soft deletion optional - here hard delete)
const deleteNotification = async (req, res) => {
  const notifId = req.params.id;
  const userId = req.user.id;
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notifId, userId]);
    await connection.release();
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('❌ Error deleting notification', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// helper to create a notification for a user
const createNotification = async ({ userId, type, entityType, entityId, message }) => {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO notifications (user_id, type, entity_type, entity_id, message) VALUES (?, ?, ?, ?, ?)',
      [userId, type, entityType, entityId, message]
    );
    await connection.release();
  } catch (err) {
    console.error('❌ Error creating notification:', err);
  }
};

module.exports = {
  getNotifications,
  deleteNotification,
  createNotification,
};