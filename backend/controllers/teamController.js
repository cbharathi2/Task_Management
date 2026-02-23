const pool = require('../config/database');

const createTeam = async (req, res) => {
  const { name, description, teamLeaderId, teamMembers } = req.body;
  const createdBy = req.user.id;

  // Only admins can create teams
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can create teams' });
  }

  // Validate required fields
  if (!name || !teamLeaderId) {
    return res.status(400).json({ message: 'Team name and team leader are required' });
  }

  try {
    const connection = await pool.getConnection();

    console.log('👥 Creating team:', { name, teamLeaderId, teamMembers });

    // Insert team
    const [teamResult] = await connection.query(
      'INSERT INTO teams (name, description, team_leader_id, created_by) VALUES (?, ?, ?, ?)',
      [name, description || '', teamLeaderId, createdBy]
    );

    const teamId = teamResult.insertId;

    // Add team members if provided (excluding team leader - they'll be added separately)
    if (teamMembers && Array.isArray(teamMembers)) {
      for (const memberId of teamMembers) {
        if (memberId !== parseInt(teamLeaderId)) {
          await connection.query(
            'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
            [teamId, memberId]
          );
        }
      }
    }

    // Add team leader as a member
    try {
      await connection.query(
        'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
        [teamId, teamLeaderId]
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') {
        throw err;
      }
    }

    await connection.release();

    console.log(`✅ Team created with ID: ${teamId}`);

    res.status(201).json({
      message: 'Team created successfully',
      teamId: teamId
    });
  } catch (err) {
    console.error('❌ Error creating team:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTeams = async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();

    console.log(`📥 Fetching teams for user ID: ${userId}`);

    let query, params;

    if (req.user.role === 'admin') {
      // Admins see all teams
      query = `SELECT t.id, t.name, t.description, t.team_leader_id, t.created_by, t.created_at, 
               u.name as team_leader_name 
               FROM teams t 
               LEFT JOIN users u ON t.team_leader_id = u.id 
               ORDER BY t.created_at DESC`;
      params = [];
    } else {
      // Employees see only their teams
      query = `SELECT t.id, t.name, t.description, t.team_leader_id, t.created_by, t.created_at, 
               u.name as team_leader_name 
               FROM teams t 
               LEFT JOIN users u ON t.team_leader_id = u.id 
               INNER JOIN team_members tm ON t.id = tm.team_id 
               WHERE tm.user_id = ? 
               ORDER BY t.created_at DESC`;
      params = [userId];
    }

    const [teams] = await connection.query(query, params);

    console.log(`✅ Teams fetched: ${teams?.length || 0} teams found`);

    await connection.release();

    res.json({ teams: teams || [] });
  } catch (err) {
    console.error(`❌ Error fetching teams:`, err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTeamDetails = async (req, res) => {
  const teamId = req.params.id;
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();

    // Check if user is part of the team or admin
    if (req.user.role !== 'admin') {
      const [membership] = await connection.query(
        'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId]
      );
      if (membership.length === 0) {
        await connection.release();
        return res.status(403).json({ message: 'Access denied to this team' });
      }
    }

    // Get team info
    const [teams] = await connection.query(
      `SELECT t.id, t.name, t.description, t.team_leader_id, t.created_by, t.created_at, 
              u.name as team_leader_name 
       FROM teams t 
       LEFT JOIN users u ON t.team_leader_id = u.id 
       WHERE t.id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get team members
    const [members] = await connection.query(
      `SELECT u.id, u.name, u.email, u.role 
       FROM team_members tm 
       INNER JOIN users u ON tm.user_id = u.id 
       WHERE tm.team_id = ? 
       ORDER BY u.name`,
      [teamId]
    );

    await connection.release();

    res.json({
      team: teams[0],
      members: members || []
    });
  } catch (err) {
    console.error('❌ Error fetching team details:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateTeam = async (req, res) => {
  const teamId = req.params.id;
  const { name, description, teamLeaderId } = req.body;

  // Only admins can update teams
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can update teams' });
  }

  try {
    const connection = await pool.getConnection();

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (teamLeaderId) {
      updates.push('team_leader_id = ?');
      values.push(teamLeaderId);
    }

    if (updates.length === 0) {
      await connection.release();
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(teamId);

    await connection.query(
      `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await connection.release();

    console.log(`✅ Team updated: ${teamId}`);

    res.json({ message: 'Team updated successfully' });
  } catch (err) {
    console.error('❌ Error updating team:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteTeam = async (req, res) => {
  const teamId = req.params.id;

  // Only admins can delete teams
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete teams' });
  }

  try {
    const connection = await pool.getConnection();

    // Delete team members first
    await connection.query('DELETE FROM team_members WHERE team_id = ?', [teamId]);

    // Delete team
    await connection.query('DELETE FROM teams WHERE id = ?', [teamId]);

    await connection.release();

    console.log(`✅ Team deleted: ${teamId}`);

    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting team:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addTeamMember = async (req, res) => {
  const teamId = req.params.id;
  const { userId } = req.body;

  // Only admins can add team members
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can add team members' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if already a member
    const [existing] = await connection.query(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );

    if (existing.length > 0) {
      await connection.release();
      return res.status(400).json({ message: 'User is already a team member' });
    }

    await connection.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, userId]
    );

    await connection.release();

    console.log(`✅ Team member added: User ${userId} to Team ${teamId}`);

    res.json({ message: 'Team member added successfully' });
  } catch (err) {
    console.error('❌ Error adding team member:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const removeTeamMember = async (req, res) => {
  const teamId = req.params.id;
  const { userId } = req.body;

  // Only admins can remove team members
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can remove team members' });
  }

  try {
    const connection = await pool.getConnection();

    await connection.query(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );

    await connection.release();

    console.log(`✅ Team member removed: User ${userId} from Team ${teamId}`);

    res.json({ message: 'Team member removed successfully' });
  } catch (err) {
    console.error('❌ Error removing team member:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamDetails,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
};
