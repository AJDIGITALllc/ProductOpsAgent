import express from 'express';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /auth/login
 * Simple login endpoint for demo/testing
 * In production, integrate with real auth provider
 */
router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'email and password are required'
      });
    }
    
    // Demo auth - accept any credentials
    // In production, verify against database
    const user = {
      userId: `user_${Date.now()}`,
      email,
      role: role || 'User' // Default role is User
    };
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /auth/token
 * Generate a token for testing
 */
router.post('/token', (req, res) => {
  try {
    const { userId, email, role } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId and email are required'
      });
    }
    
    const user = {
      userId,
      email,
      role: role || 'User'
    };
    
    const token = generateToken(user);
    
    res.json({
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

export default router;
