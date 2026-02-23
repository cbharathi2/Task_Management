const pool = require('./database');

/**
 * Initialize database tables
 * Creates teams and team_members tables if they don't exist
 */
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    // Create teams table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        team_leader_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_leader_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create team_members table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_team_member (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add team_id column to tasks table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE tasks ADD COLUMN team_id INT`);
      console.log('✅ Added team_id column to tasks table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  team_id column already exists in tasks table');
      } else {
        console.error('⚠️  Error adding team_id to tasks:', err.message);
      }
    }

    // Add project_id column to tasks table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE tasks ADD COLUMN project_id INT`);
      console.log('✅ Added project_id column to tasks table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  project_id column already exists in tasks table');
      } else {
        console.error('⚠️  Error adding project_id to tasks:', err.message);
      }
    }

    // Add foreign key for team_id in tasks
    try {
      await connection.query(`ALTER TABLE tasks ADD FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL`);
    } catch (err) {
      console.log('ℹ️  Foreign key for tasks.team_id may already exist:', err.message.substring(0, 50));
    }

    // Add foreign key for project_id in tasks
    try {
      await connection.query(`ALTER TABLE tasks ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL`);
    } catch (err) {
      console.log('ℹ️  Foreign key for tasks.project_id may already exist:', err.message.substring(0, 50));
    }

    // Make assigned_to nullable in tasks table (allows team assignments without specific user)
    try {
      await connection.query(`ALTER TABLE tasks MODIFY COLUMN assigned_to INT NULL`);
      console.log('✅ Made assigned_to column nullable in tasks table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Syntax error')) {
        console.log('ℹ️  assigned_to column is already properly configured');
      } else {
        console.error('⚠️  Error modifying assigned_to column:', err.message);
      }
    }

    // Add team_id column to goals table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE goals ADD COLUMN team_id INT`);
      console.log('✅ Added team_id column to goals table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  team_id column already exists in goals table');
      } else {
        console.error('⚠️  Error adding team_id to goals:', err.message);
      }
    }

    // Add foreign key for team_id in goals
    try {
      await connection.query(`ALTER TABLE goals ADD FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL`);
    } catch (err) {
      console.log('ℹ️  Foreign key for goals.team_id may already exist:', err.message.substring(0, 50));
    }
    // Add order_number column to projects table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN order_number VARCHAR(255) UNIQUE`);
      console.log('✅ Added order_number column to projects table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  order_number column already exists in projects table');
      } else {
        console.error('⚠️  Error adding order_number to projects:', err.message);
      }
    }
    await connection.release();

    console.log('✅ Database initialized successfully');
    console.log('   - teams table created/verified');
    console.log('   - team_members table created/verified');
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Tables already exist, skipping creation');
    } else {
      console.error('⚠️  Database initialization warning:', err.message);
    }
  }
};

module.exports = initializeDatabase;
