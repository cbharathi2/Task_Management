const pool = require('../config/database');

const createGoal = async (req, res) => {
  const { title, targetDate, goalType, teamId } = req.body;
  const ownerId = req.user.id;

  console.log('📝 Goal controller received:', { title, targetDate, goalType, teamId, ownerId });

  if (!title) {
    console.error('❌ Missing title');
    return res.status(400).json({ message: 'Title is required', error: 'MISSING_TITLE' });
  }

  if (goalType === 'team' && !teamId) {
    console.error('❌ Team goal missing teamId');
    return res.status(400).json({ message: 'Team goal must specify a team', error: 'MISSING_TEAM' });
  }

  try {
    const connection = await pool.getConnection();

    // Validate team exists if assigning to team
    if (teamId) {
      const [team] = await connection.query('SELECT id FROM teams WHERE id = ?', [teamId]);
      if (team.length === 0) {
        await connection.release();
        console.error('❌ Team not found:', teamId);
        return res.status(404).json({ message: 'Team not found', error: 'TEAM_NOT_FOUND' });
      }
    }
    
    console.log('📝 Creating goal:', { title, ownerId, targetDate, goalType, teamId });
    
    const [result] = await connection.query(
      'INSERT INTO goals (title, owner_id, target_date, goal_type, team_id) VALUES (?, ?, ?, ?, ?)',
      [title, ownerId, targetDate || null, goalType || 'personal', teamId || null]
    );

    console.log(`✅ Goal created with ID: ${result.insertId}`);
    await connection.release();

    res.status(201).json({
      message: 'Goal created successfully',
      goalId: result.insertId
    });
  } catch (err) {
    console.error('❌ Error creating goal:', err.message);
    console.error('Error code:', err.code, 'SQL State:', err.sqlState);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      code: err.code,
      sqlState: err.sqlState
    });
  }
};

const getMyGoals = async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();
    
    const [goals] = await connection.query(
      'SELECT * FROM goals WHERE owner_id = ? AND goal_type = "personal" ORDER BY target_date ASC',
      [userId]
    );

    await connection.release();

    res.json({ goals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTeamGoals = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [goals] = await connection.query(
      'SELECT g.*, u.name as owner_name FROM goals g LEFT JOIN users u ON g.owner_id = u.id WHERE g.goal_type = "team" ORDER BY g.target_date ASC'
    );

    await connection.release();

    res.json({ goals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateGoal = async (req, res) => {
  const goalId = req.params.id;
  const { title, targetDate, progress, status } = req.body;

  try {
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE goals SET title = ?, target_date = ?, progress = ?, status = ? WHERE id = ?',
      [title, targetDate, progress, status, goalId]
    );

    await connection.release();

    res.json({ message: 'Goal updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteGoal = async (req, res) => {
  const goalId = req.params.id;

  try {
    const connection = await pool.getConnection();
    
    await connection.query(
      'DELETE FROM goals WHERE id = ?',
      [goalId]
    );

    await connection.release();

    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createGoal,
  getMyGoals,
  getTeamGoals,
  updateGoal,
  deleteGoal
};
