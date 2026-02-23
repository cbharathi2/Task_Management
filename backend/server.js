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

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Task Management Backend API', 
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
  
  // Initialize database tables
  await initializeDatabase();
});
