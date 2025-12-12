import jwt from 'jsonwebtoken';
import config from '../config.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid authorization header. Expected format: Bearer <token>' 
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Token has expired' 
        });
      }
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token' 
      });
    }
  } catch (err) {
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication error' 
    });
  }
}

/**
 * Role-based Authorization Middleware
 * Restricts access to specific roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}` 
      });
    }
    
    next();
  };
}

/**
 * Utility to generate JWT tokens
 * Used for testing or initial setup
 */
export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.userId, 
      email: user.email, 
      role: user.role 
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}
