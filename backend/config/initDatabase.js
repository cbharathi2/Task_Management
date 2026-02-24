const pool = require('./database');

/**
 * Initialize database schema
 * Creates all tables in dependency order if they don't exist
 * Safe to run multiple times (idempotent)
 */
const initializeDatabase = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Step 1: Create base tables (no foreign key dependencies)
    // Users table - must be first (referenced by many tables)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');

    // Projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Projects table created/verified');

    // Goals table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        owner_id INT NOT NULL,
        target_date DATE,
        progress INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        goal_type VARCHAR(50) DEFAULT 'personal',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Goals table created/verified');

    // Tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'To-Do',
        due_date DATE,
        assigned_to INT,
        assigned_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tasks table created/verified');

    // Attachments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        file_type VARCHAR(100),
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Attachments table created/verified');

    // Step 2: Create teams table (depends on users)
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
    console.log('✅ Teams table created/verified');

    console.log('✅ Teams table created/verified');

    // Step 3: Create team_members table (depends on teams and users)
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
    console.log('✅ Team members table created/verified');

    // Step 4: Add extension columns to existing tables (idempotent)
    // Add team_id to tasks
    try {
      await connection.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id INT`);
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
      // Column/constraint may already exist - this is fine
    }

    // Add project_id to tasks
    try {
      await connection.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INT`);
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
      // Column/constraint may already exist - this is fine
    }

    // Add team_id to goals
    try {
      await connection.query(`ALTER TABLE goals ADD COLUMN IF NOT EXISTS team_id INT`);
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
      // Column/constraint may already exist - this is fine
    }

    // Add order_number to projects
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
    } catch (err) {
      // Column/constraint may already exist - this is fine
    }

    console.log('✅ Database schema initialized successfully');
    console.log('   ✓ All base tables created');
    console.log('   ✓ Teams & team members configured');
    console.log('   ✓ Extension columns added');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err; // Re-throw to prevent app from starting with broken schema
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

module.exports = initializeDatabase;
