const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/task');
const goalRoutes = require('./routes/goal');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const teamRoutes = require('./routes/teams');
const initializeDatabase = require('./config/initDatabase');

const app = express();

let dbInitialized = false;

const getAllowedOrigins = () => {
  const defaultOrigins = [
    'https://task-management-wzap.vercel.app'
  ];
  
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...defaultOrigins, ...envOrigins])];
};

const ensureDatabaseInitialized = async () => {
  if (dbInitialized) {
    return;
  }

  await initializeDatabase();
  dbInitialized = true;
};

// Middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Database readiness check middleware - ensures DB is initialized before handling requests
app.use(async (req, res, next) => {
  // If database not initialized, initialize it now (Vercel cold start handling)
  if (!dbInitialized) {
    try {
      await ensureDatabaseInitialized();
    } catch (error) {
      console.error('❌ Middleware: Database initialization failed:', error.message);
      // Don't block health check from reporting status
      if (req.path !== '/api/health') {
        return res.status(503).json({ 
          message: 'Database initialization failed',
          error: error.message
        });
      }
    }
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Task Management Backend API', 
    version: '1.0.0',
    status: 'running',
    dbInitialized: dbInitialized,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  if (!dbInitialized) {
    return res.status(503).json({ 
      status: 'Database initialization in progress or failed',
      dbInitialized: false,
      timestamp: new Date().toISOString()
    });
  }
  res.json({ 
    status: 'Server is running', 
    dbInitialized: true,
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/files', fileRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.path,
    method: req.method 
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// On Vercel, the middleware will initialize DB on first request
// On local, initialize immediately before listening
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🗄️  Database: ${process.env.PGDATABASE || process.env.DB_NAME} @ ${process.env.PGHOST || process.env.DB_HOST}`);

    try {
      await ensureDatabaseInitialized();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1); // Don't continue if DB init fails
    }
  });
}

module.exports = app;
