const pool = require('../config/database');
const { createNotification } = require('./notificationController');


const createTask = async (req, res) => {
  const { title, description, assignedTo, teamId, projectId, priority, dueDate, taskNumber } = req.body;
  const assignedBy = req.user.id;

  console.log('📝 Task controller received:', { title, description, assignedTo, teamId, projectId, priority, dueDate, assignedBy });

  // Validate required fields - must have either assignedTo or teamId
  if (!title) {
    console.error('❌ Missing title');
    return res.status(400).json({ message: 'Title is required', error: 'MISSING_TITLE' });
  }

  if (!dueDate || dueDate.trim() === '') {
    console.error('❌ Missing due date');
    return res.status(400).json({ message: 'Due date is required', error: 'MISSING_DUE_DATE' });
  }

  if (!assignedTo && !teamId) {
    console.error('❌ Missing both assignedTo and teamId:', { assignedTo, teamId });
    return res.status(400).json({ message: 'Task must be assigned to either a user or team', error: 'MISSING_ASSIGNMENT' });
  }

  // Cannot assign to both user and team
  if (assignedTo && teamId) {
    console.error('❌ Both assignedTo and teamId provided');
    return res.status(400).json({ message: 'Cannot assign task to both user and team', error: 'DOUBLE_ASSIGNMENT' });
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

    // Validate user exists if assigning to user
    if (assignedTo) {
      const [user] = await connection.query('SELECT id FROM users WHERE id = ?', [assignedTo]);
      if (user.length === 0) {
        await connection.release();
        console.error('❌ User not found:', assignedTo);
        return res.status(404).json({ message: 'User not found', error: 'USER_NOT_FOUND' });
      }
    }
    
    console.log('📝 Creating task:', { title, assignedTo, teamId, assignedBy, projectId, dueDate, taskNumber });
    
    const [result] = await connection.query(
      'INSERT INTO tasks (title, description, assigned_to, team_id, assigned_by, project_id, priority, due_date, status, task_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', assignedTo || null, teamId || null, assignedBy, projectId || null, priority || 'Medium', dueDate || null, 'To-Do', taskNumber || null]
    );

    console.log(`✅ Task created with ID: ${result.insertId}, assigned to ${assignedTo ? `user ${assignedTo}` : `team ${teamId}`}`);

    const newTaskId = result.insertId;

    await connection.release();

    // generate notifications
    try {
      if (assignedTo) {
        if (assignedTo !== assignedBy) {
          await createNotification({
            userId: assignedTo,
            type: 'task',
            entityType: 'task',
            entityId: newTaskId,
            message: `You have been assigned a new task: ${title}`
          });
        }
      } else if (teamId) {
        // notify each team member except the creator
        const conn2 = await pool.getConnection();
        const [members] = await conn2.query('SELECT user_id FROM team_members WHERE team_id = ?', [teamId]);
        await conn2.release();
        for (const m of members) {
          if (m.user_id !== assignedBy) {
            await createNotification({
              userId: m.user_id,
              type: 'task',
              entityType: 'task',
              entityId: newTaskId,
              message: `New task assigned to your team: ${title}`
            });
          }
        }
      }
    } catch (notifErr) {
      console.error('❌ Error creating notification(s) for task:', notifErr);
    }

    res.status(201).json({
      message: 'Task created successfully',
      taskId: result.insertId
    });
  } catch (err) {
    console.error('❌ Error creating task:', err.message);
    console.error('Error code:', err.code, 'SQL State:', err.sqlState);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message, 
      code: err.code,
      sqlState: err.sqlState
    });
  }
};

const getMyTasks = async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();
    
    console.log(`📋 Fetching tasks for user ID: ${userId}`);
    
    // Get tasks directly assigned to user OR assigned to teams user belongs to
    const [tasks] = await connection.query(
      `SELECT DISTINCT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.assigned_to, t.team_id, t.assigned_by, t.project_id, t.task_number, t.created_at, t.updated_at,
              u.name as assigned_to_name, tm.name as team_name, p.order_number as project_order_number, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN teams tm ON t.team_id = tm.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN team_members tmem ON t.team_id = tmem.team_id
       WHERE t.assigned_to = ? OR (t.team_id IS NOT NULL AND tmem.user_id = ?)
       ORDER BY t.due_date ASC`,
      [userId, userId]
    );

    console.log(`✅ Tasks fetched for user ${userId}:`, tasks?.length || 0, 'tasks found');
    
    if (tasks && tasks.length > 0) {
      console.log('📌 Sample task:', tasks[0]);
    }
    
    await connection.release();

    res.json({ tasks: tasks || [] });
  } catch (err) {
    console.error(`❌ Error fetching tasks for user ${userId}:`, err.message);
    console.error('Error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTasksAssignedByMe = async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await pool.getConnection();
    
    console.log(`📤 Fetching tasks assigned by user ${userId}`);
    
    const [tasks] = await connection.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.assigned_to, t.team_id, t.assigned_by, t.project_id, t.task_number, t.created_at, t.updated_at,
              u.name as assigned_to_name, tm.name as team_name, p.order_number as project_order_number, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN teams tm ON t.team_id = tm.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_by = ?
       ORDER BY t.created_at DESC`,
      [userId]
    );

    console.log(`✅ Tasks assigned by user ${userId}:`, tasks?.length || 0, 'tasks found');

    await connection.release();

    res.json({ tasks: tasks || [] });
  } catch (err) {
    console.error(`❌ Error fetching tasks assigned by user ${userId}:`, err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateTask = async (req, res) => {
  const taskId = req.params.id;
  const updates = req.body;

  try {
    const connection = await pool.getConnection();
    
    // Get task to check ownership
    const [tasks] = await connection.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    
    if (tasks.length === 0) {
      await connection.release();
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[0];
    
    // Only admin or the assigned user can update
    if (req.user.role !== 'admin' && req.user.id !== task.assigned_to) {
      await connection.release();
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Build dynamic query based on what's being updated
    const allowedFields = ['title', 'description', 'priority', 'status', 'due_date', 'assigned_to', 'task_number', 'team_id', 'project_id'];
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
    
    values.push(taskId);
    
    await connection.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    await connection.release();

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteTask = async (req, res) => {
  const taskId = req.params.id;

  // Only admins can delete tasks
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete tasks' });
  }

  try {
    const connection = await pool.getConnection();
    
    await connection.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    await connection.release();

    console.log(`✅ Task deleted: ${taskId}`);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const connection = await pool.getConnection();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // For admins, get tasks assigned by them + tasks assigned to them
    // For employees, get tasks assigned to them + tasks assigned to their teams
    let whereClause = `t.assigned_to = ? OR (t.team_id IS NOT NULL AND tm.user_id = ?)`;
    let params = [userId, userId];
    let joinClause = `LEFT JOIN team_members tm ON t.team_id = tm.team_id`;

    if (userRole === 'admin') {
      whereClause = `(t.assigned_to = ? OR t.assigned_by = ? OR (t.team_id IS NOT NULL AND tm.user_id = ?))`;
      params = [userId, userId, userId];
    }

    // Get stats for current user
    const [totalTasks] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause}`,
      params
    );

    const [completedTasks] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} AND t.status = "Completed"`,
      params
    );

    const [incompleteTasks] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} AND t.status != "Completed"`,
      params
    );

    const [overdueTasks] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} AND t.status != "Completed" AND t.due_date < NOW()`,
      params
    );

    const [recentlyAssigned] = await connection.query(
      `SELECT LEAST(COUNT(DISTINCT t.id), 10) as count FROM tasks t ${joinClause} WHERE ${whereClause}`,
      params
    );

    const [doToday] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} AND DATE(t.due_date) = DATE(?)`,
      [...params, todayStart]
    );

    const [doNextWeek] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} AND DATE(t.due_date) BETWEEN DATE(?) AND DATE(?)`,
      [...params, todayStart, nextWeekEnd]
    );

    const [doLater] = await connection.query(
      `SELECT COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} AND DATE(t.due_date) > DATE(?)`,
      [...params, nextWeekEnd]
    );

    // Completion status for all tasks
    const [statusStats] = await connection.query(
      `SELECT t.status, COUNT(DISTINCT t.id) as count FROM tasks t ${joinClause} WHERE ${whereClause} GROUP BY t.status`,
      params
    );

    // Task completion trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [trendData] = await connection.query(
      `SELECT DATE(t.created_at) as date, COUNT(DISTINCT t.id) as total, SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed FROM tasks t ${joinClause} WHERE ${whereClause} AND t.created_at >= ? GROUP BY DATE(t.created_at) ORDER BY date`,
      [...params, thirtyDaysAgo]
    );

    await connection.release();

    res.json({
      stats: {
        totalTasks: totalTasks[0]?.count || 0,
        totalCompleted: completedTasks[0]?.count || 0,
        totalIncomplete: incompleteTasks[0]?.count || 0,
        totalOverdue: overdueTasks[0]?.count || 0,
        recentlyAssignedCount: recentlyAssigned[0]?.count || 0,
        doTodayCount: doToday[0]?.count || 0,
        doNextWeekCount: doNextWeek[0]?.count || 0,
        doLaterCount: doLater[0]?.count || 0,
        completionStatusAll: statusStats || [],
        taskCompletionOverTime: trendData || []
      }
    });
  } catch (err) {
    console.error('❌ Error getting dashboard stats:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  getTasksAssignedByMe,
  updateTask,
  deleteTask,
  getDashboardStats
};
