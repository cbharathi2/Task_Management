const pool = require('../config/database');

const createProject = async (req, res) => {
  const { name, description, order_number } = req.body;
  const createdBy = req.user.id;

  // Only admins can create projects
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can create projects' });
  }

  if (!order_number || order_number.trim() === '') {
    return res.status(400).json({ message: 'Order number is required' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'INSERT INTO projects (name, description, order_number, created_by) VALUES (?, ?, ?, ?)',
      [name, description, order_number, createdBy]
    );

    await connection.release();

    console.log(`✅ Project created with ID: ${result.insertId} by user ${createdBy}`);
    res.status(201).json({
      message: 'Project created successfully',
      projectId: result.insertId
    });
  } catch (err) {
    console.error('❌ Error creating project:', err.message);
    
    // Check for duplicate order number
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Order number already exists. Please use a unique order number.' });
    }
    
    res.status(500).json({ message: 'Failed to create project. Please check the form data and try again.', error: err.message });
  }
};


const getAllProjects = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [projects] = await connection.query(
      `SELECT p.*, COUNT(t.id) as task_count FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    await connection.release();

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateProject = async (req, res) => {
  const projectId = req.params.id;
  const updates = req.body;

  try {
    const connection = await pool.getConnection();
    
    // Build dynamic query based on what's being updated
    const allowedFields = ['name', 'description', 'status', 'order_number'];
    const fields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => `${key} = ?`);
    
    if (fields.length === 0) {
      await connection.release();
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => updates[key]);
    
    values.push(projectId);
    
    await connection.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    await connection.release();

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteProject = async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  // Only admins can delete projects
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete projects' });
  }

  try {
    const connection = await pool.getConnection();
    
    // Verify project exists
    const [project] = await connection.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    if (!project.length) {
      await connection.release();
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`🗑️ Deleting project ${projectId}`);
    
    await connection.query('DELETE FROM projects WHERE id = ?', [projectId]);

    await connection.release();

    console.log(`✅ Project ${projectId} deleted successfully`);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting project:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Fetch tasks belonging to a specific project
const getProjectTasks = async (req, res) => {
  const projectId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const [tasks] = await connection.query(
      `SELECT t.*, u.name as assigned_to_name, tm.name as team_name, p.order_number as project_order_number
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN teams tm ON t.team_id = tm.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.project_id = ?
       ORDER BY t.task_number IS NULL, t.task_number, t.created_at ASC`,
      [projectId]
    );
    await connection.release();
    res.json({ tasks: tasks || [] });
  } catch (err) {
    console.error('❌ Error fetching tasks for project', projectId, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getProjectTasks
};
