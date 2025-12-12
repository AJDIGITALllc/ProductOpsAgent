import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || process.env.APP_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or APP_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const secret = process.env.JWT_SECRET || process.env.APP_SECRET;
      if (secret) {
        const decoded = jwt.verify(token, secret) as any;
        req.user = {
          id: decoded.id || decoded.userId,
          email: decoded.email,
          role: decoded.role || 'user',
        };
      }
    }
    next();
  } catch (error) {
    // In optional auth, we continue even if token is invalid
    next();
  }
};
