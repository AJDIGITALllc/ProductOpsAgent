import { Router } from 'express';
import { prisma } from '@product-ops-agent/database';
import { whopClient } from '../integrations/whop/WhopClient';
import { HealthStatus } from '../types';

const router = Router();

/**
 * GET /health - Health check endpoint
 */
router.get('/', async (req, res) => {
  let databaseStatus: 'connected' | 'error' = 'connected';
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseStatus = 'error';
  }
  
  const health: HealthStatus = {
    mode: whopClient.mode,
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  };
  
  const statusCode = databaseStatus === 'error' ? 503 : 200;
  res.status(statusCode).json(health);
});

export default router;
