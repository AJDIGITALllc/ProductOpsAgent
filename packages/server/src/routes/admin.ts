import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getWebhookStatus } from '../services/webhooks';
import { prisma } from '@product-ops-agent/database';

const router = Router();

/**
 * GET /admin/webhooks/:planId - Get webhook delivery status for a plan
 */
router.get('/webhooks/:planId', authenticate, requireRole('Owner'), async (req: AuthRequest, res) => {
  try {
    const { planId } = req.params;
    
    const webhooks = await getWebhookStatus(planId);
    
    res.json({
      planId,
      webhooks: webhooks.map(w => ({
        id: w.id,
        eventType: w.eventType,
        status: w.status,
        attempts: w.attempts,
        maxAttempts: w.maxAttempts,
        nextRetryAt: w.nextRetryAt,
        lastAttemptAt: w.lastAttemptAt,
        deliveredAt: w.deliveredAt,
        errorMessage: w.errorMessage,
        createdAt: w.createdAt,
        attemptsHistory: w.attempts_history,
      })),
    });
  } catch (error: any) {
    console.error('Get webhook status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/webhooks - Get all webhook deliveries
 */
router.get('/webhooks', authenticate, requireRole('Owner'), async (req: AuthRequest, res) => {
  try {
    const webhooks = await prisma.webhookDelivery.findMany({
      include: {
        attempts_history: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    res.json({
      webhooks: webhooks.map(w => ({
        id: w.id,
        planId: w.planId,
        eventType: w.eventType,
        status: w.status,
        attempts: w.attempts,
        maxAttempts: w.maxAttempts,
        nextRetryAt: w.nextRetryAt,
        lastAttemptAt: w.lastAttemptAt,
        deliveredAt: w.deliveredAt,
        errorMessage: w.errorMessage,
        createdAt: w.createdAt,
        attemptsHistory: w.attempts_history,
      })),
    });
  } catch (error: any) {
    console.error('Get all webhooks error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/audit - Get audit logs
 */
router.get('/audit', authenticate, requireRole('Owner'), async (req: AuthRequest, res) => {
  try {
    const { userId, planId, limit = '100' } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (planId) where.planId = planId;
    
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
    });
    
    res.json({
      logs: logs.map(log => ({
        ...log,
        details: JSON.parse(log.details),
      })),
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
