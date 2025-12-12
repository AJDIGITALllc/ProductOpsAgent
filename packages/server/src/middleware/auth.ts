import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_ISSUER = process.env.JWT_ISSUER || 'product-ops-agent';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'product-ops-agent-api';

// Parse user allowlist from environment
function getUserAllowlist(): Map<string, { sub: string; role: 'Owner' | 'User' }> {
  const allowlistJson = process.env.USER_ALLOWLIST || '[]';
  try {
    const allowlist = JSON.parse(allowlistJson);
    const map = new Map();
    for (const user of allowlist) {
      map.set(user.sub, user);
    }
    return map;
  } catch (error) {
    console.error('Failed to parse USER_ALLOWLIST:', error);
    return new Map();
  }
}

const userAllowlist = getUserAllowlist();

export interface AuthRequest extends Request {
  user?: User;
  correlationId?: string;
}

/**
 * Middleware to authenticate JWT tokens.
 * Roles are derived from server-side allowlist, NOT from token claims.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as any;
    
    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Get user from allowlist (server-side role derivation)
    const allowedUser = userAllowlist.get(decoded.sub);
    if (!allowedUser) {
      return res.status(403).json({ error: 'User not in allowlist' });
    }
    
    // Set user with server-derived role
    req.user = {
      sub: decoded.sub,
      role: allowedUser.role, // Role comes from server allowlist, not token
      exp: decoded.exp,
      iss: decoded.iss,
      aud: decoded.aud,
    };
    
    next();
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
}

/**
 * Middleware to require a specific role.
 */
export function requireRole(role: 'Owner' | 'User') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (req.user.role !== role && role === 'Owner') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Optional authentication - sets user if token is present and valid, but doesn't require it.
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as any;
    
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return next();
    }
    
    const allowedUser = userAllowlist.get(decoded.sub);
    if (allowedUser) {
      req.user = {
        sub: decoded.sub,
        role: allowedUser.role,
        exp: decoded.exp,
        iss: decoded.iss,
        aud: decoded.aud,
      };
    }
  } catch (error) {
    // Invalid token, just continue without setting user
  }
  
  next();
}
