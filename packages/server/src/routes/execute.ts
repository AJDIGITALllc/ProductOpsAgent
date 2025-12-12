import { Router } from 'express';
import { prisma } from '@product-ops-agent/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { executePlan } from '../services/executor';
import { createAuditLog } from '../services/audit';

const router = Router();

/**
 * POST /execute/:planId - Execute an approved plan
 */
router.post('/:planId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await prisma.plan.findUnique({
      where: { planId },
      include: {
        actions: {
          orderBy: { actionIndex: 'asc' },
        },
      },
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    if (plan.status !== 'APPROVED') {
      return res.status(400).json({ error: `Cannot execute plan in status: ${plan.status}. Plan must be APPROVED.` });
    }
    
    // Update plan status to EXECUTING
    await prisma.plan.update({
      where: { planId },
      data: {
        status: 'EXECUTING',
      },
    });
    
    // Audit log
    await createAuditLog({
      planId,
      userId: req.user!.sub,
      action: 'EXECUTION_STARTED',
      details: { planId },
      ipAddress: req.ip,
      correlationId: req.correlationId,
    });
    
    // Parse plan and execute
    const actionPlan = JSON.parse(plan.planJson);
    const result = await executePlan(actionPlan, req.user!.sub, req.correlationId);
    
    // Update plan status based on result
    const finalStatus = result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
    await prisma.plan.update({
      where: { planId },
      data: {
        status: finalStatus,
      },
    });
    
    // Audit log
    await createAuditLog({
      planId,
      userId: req.user!.sub,
      action: 'EXECUTION_COMPLETED',
      details: { result },
      ipAddress: req.ip,
      correlationId: req.correlationId,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Execute plan error:', error);
    
    // Try to update plan status to FAILED
    try {
      const { planId } = req.params;
      await prisma.plan.update({
        where: { planId },
        data: {
          status: 'FAILED',
        },
      });
    } catch (updateError) {
      // Ignore update error
    }
    
    res.status(500).json({ error: error.message });
  }
});

export default router;
