import { Request, Response, NextFunction } from 'express';
import { prisma } from '@product-ops-agent/database';
import { AuthRequest } from './auth';

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

/**
 * Rate limiting middleware that primarily uses authenticated user ID (JWT sub).
 * Falls back to IP address for unauthenticated endpoints.
 */
export async function rateLimitMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  const identifier = authReq.user?.sub || req.ip || 'unknown';
  const endpoint = req.path;
  
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  
  try {
    // Clean up expired rate limit entries
    await prisma.rateLimit.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    
    // Count requests in current window
    const recentRequests = await prisma.rateLimit.count({
      where: {
        identifier,
        endpoint,
        windowStart: {
          gte: windowStart,
        },
      },
    });
    
    if (recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: RATE_LIMIT_WINDOW_MS / 1000,
      });
    }
    
    // Record this request
    await prisma.rateLimit.create({
      data: {
        identifier,
        endpoint,
        count: 1,
        windowStart: now,
        expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS),
      },
    });
    
    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // Don't block requests on rate limit errors
    next();
  }
}
