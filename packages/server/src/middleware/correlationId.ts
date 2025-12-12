import { Request, Response, NextFunction } from 'express';
import { generateCorrelationId } from '../utils/hash';
import { AuthRequest } from './auth';

/**
 * Middleware to add correlation ID to all requests.
 */
export function correlationIdMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  req.correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  res.setHeader('X-Correlation-Id', req.correlationId);
  next();
}
