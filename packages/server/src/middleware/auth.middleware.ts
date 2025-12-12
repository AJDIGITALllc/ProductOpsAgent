import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth/auth.service';
import { AuthToken, UserRole } from '../types/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthToken;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    const user = authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware to require owner role
 */
export const requireOwner = requireRole(UserRole.OWNER);

/**
 * Middleware to require owner or admin role
 */
export const requireOwnerOrAdmin = requireRole(UserRole.OWNER, UserRole.ADMIN);
