const pool = require('./database');

/**
 * Initialize database tables
 * Creates teams and team_members tables if they don't exist
 */
const initializeDatabase = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Create teams table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        team_leader_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_leader_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create team_members table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_team_member UNIQUE (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add team_id column to tasks table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id INT`);
      console.log('✅ Added team_id column to tasks table');
    } catch (err) {
      console.error('⚠️  Error adding team_id to tasks:', err.message);
    }

    // Add project_id column to tasks table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INT`);
      console.log('✅ Added project_id column to tasks table');
    } catch (err) {
      console.error('⚠️  Error adding project_id to tasks:', err.message);
    }

    // Add foreign key for team_id in tasks
    try {
      await connection.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_team_id') THEN
            ALTER TABLE tasks
            ADD CONSTRAINT fk_tasks_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
    } catch (err) {
      console.log('ℹ️  Foreign key for tasks.team_id may already exist:', err.message.substring(0, 50));
    }

    // Add foreign key for project_id in tasks
    try {
      await connection.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_project_id') THEN
            ALTER TABLE tasks
            ADD CONSTRAINT fk_tasks_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
    } catch (err) {
      console.log('ℹ️  Foreign key for tasks.project_id may already exist:', err.message.substring(0, 50));
    }

    // Make assigned_to nullable in tasks table (allows team assignments without specific user)
    try {
      await connection.query(`ALTER TABLE tasks ALTER COLUMN assigned_to DROP NOT NULL`);
      console.log('✅ Made assigned_to column nullable in tasks table');
    } catch (err) {
      console.error('⚠️  Error modifying assigned_to column:', err.message);
    }

    // Add team_id column to goals table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE goals ADD COLUMN IF NOT EXISTS team_id INT`);
      console.log('✅ Added team_id column to goals table');
    } catch (err) {
      console.error('⚠️  Error adding team_id to goals:', err.message);
    }

    // Add foreign key for team_id in goals
    try {
      await connection.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_goals_team_id') THEN
            ALTER TABLE goals
            ADD CONSTRAINT fk_goals_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
    } catch (err) {
      console.log('ℹ️  Foreign key for goals.team_id may already exist:', err.message.substring(0, 50));
    }

    // Add order_number column to projects table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS order_number VARCHAR(255)`);
      await connection.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_projects_order_number') THEN
            ALTER TABLE projects
            ADD CONSTRAINT unique_projects_order_number UNIQUE (order_number);
          END IF;
        END $$;
      `);
      console.log('✅ Added order_number column to projects table');
    } catch (err) {
      console.error('⚠️  Error adding order_number to projects:', err.message);
    }

    console.log('✅ Database initialized successfully');
    console.log('   - teams table created/verified');
    console.log('   - team_members table created/verified');
  } catch (err) {
    console.error('⚠️  Database initialization warning:', err.message);
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

module.exports = initializeDatabase;
