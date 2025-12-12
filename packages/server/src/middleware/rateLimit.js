import rateLimit from 'express-rate-limit';
import config from '../config.js';

/**
 * Rate limiting middleware
 * Limits requests per user/IP
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if authenticated, otherwise IP
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});
