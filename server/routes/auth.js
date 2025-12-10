import express from 'express';
const router = express.Router();

// Mock user database (replace with real DB)
const users = new Map();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      tier: 'free',
      createdAt: new Date().toISOString(),
      memoryCount: 0,
      memoryLimit: 1000
    };

    users.set(email, { ...user, password }); // In production: hash password

    // Generate JWT token
    const token = `jwt_${Buffer.from(user.id).toString('base64')}`;

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        memoryLimit: user.memoryLimit
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userData = users.get(email);
    if (!userData || userData.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = `jwt_${Buffer.from(userData.id).toString('base64')}`;

    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      tier: userData.tier,
      memoryLimit: userData.memoryLimit,
      memoryCount: userData.memoryCount
    };

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  // Mock authentication - in production, verify JWT
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const userId = Buffer.from(token.replace('jwt_', ''), 'base64').toString();
    
    // Find user
    for (const [email, userData] of users.entries()) {
      if (userData.id === userId) {
        return res.json({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          tier: userData.tier,
          memoryLimit: userData.memoryLimit,
          memoryCount: userData.memoryCount
        });
      }
    }

    res.status(404).json({ error: 'User not found' });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
