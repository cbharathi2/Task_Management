const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const connection = await pool.getConnection();
    
    const [existingUser] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.release();
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'employee']
    );

    await connection.release();

    console.log(`✅ User registered: ${email}`);
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (err) {
    console.error('❌ Register error:', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const connection = await pool.getConnection();
    
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    await connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [users] = await connection.query(
      'SELECT id, name, email, role FROM users ORDER BY name ASC'
    );

    await connection.release();

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, getUsers };
