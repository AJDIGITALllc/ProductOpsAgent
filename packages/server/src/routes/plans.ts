import { Router } from 'express';
import { prisma } from '@product-ops-agent/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validateActionPlan } from '../utils/validation';
import { createAuditLog } from '../services/audit';
import { generatePlan } from '../ai/OpenAIPlanner';

const router = Router();

/**
 * POST /plans - Create a new action plan
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const plannerMode = process.env.PLANNER_MODE || 'RULES';
    let plan;
    
    if (plannerMode === 'OPENAI') {
      // OpenAI mode: expect user prompt
      const { prompt, templateData } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required in OPENAI mode' });
      }
      
      plan = await generatePlan(prompt, undefined, templateData);
    } else {
      // Rules mode: expect structured plan
      const validation = validateActionPlan(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      plan = validation.plan;
    }
    
    // Store plan in database
    const dbPlan = await prisma.plan.create({
      data: {
        planId: plan.planId,
        userId: req.user!.sub,
        status: 'DRAFT',
        planJson: JSON.stringify(plan),
      },
    });
    
    // Store actions
    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i];
      await prisma.action.create({
        data: {
          planId: plan.planId,
          actionIndex: i,
          actionType: action.type,
          payload: JSON.stringify(action.payload),
          status: 'PENDING',
        },
      });
    }
    
    // Audit log
    await createAuditLog({
      planId: plan.planId,
      userId: req.user!.sub,
      action: 'PLAN_CREATED',
      details: { plan },
      ipAddress: req.ip,
      correlationId: req.correlationId,
    });
    
    res.status(201).json({
      planId: plan.planId,
      status: 'DRAFT',
      plan,
    });
  } catch (error: any) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /plans/:planId - Get a plan
 */
router.get('/:planId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await prisma.plan.findUnique({
      where: { planId },
      include: {
        actions: {
          orderBy: { actionIndex: 'asc' },
        },
        approvals: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({
      planId: plan.planId,
      status: plan.status,
      plan: JSON.parse(plan.planJson),
      actions: plan.actions.map(a => ({
        ...a,
        payload: JSON.parse(a.payload),
        result: a.result ? JSON.parse(a.result) : null,
      })),
      approvals: plan.approvals,
      execution: plan.executions[0] ? {
        ...plan.executions[0],
        resultJson: plan.executions[0].resultJson ? JSON.parse(plan.executions[0].resultJson) : null,
      } : null,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    });
  } catch (error: any) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /plans/:planId/approve - Approve a plan
 */
router.post('/:planId/approve', authenticate, async (req: AuthRequest, res) => {
  try {
    const { planId } = req.params;
    const { decision, reason } = req.body;
    
    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }
    
    const plan = await prisma.plan.findUnique({
      where: { planId },
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    if (plan.status !== 'PENDING_APPROVAL' && plan.status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot approve plan in status: ${plan.status}` });
    }
    
    // Create approval record
    await prisma.approval.create({
      data: {
        planId,
        userId: req.user!.sub,
        decision,
        reason,
      },
    });
    
    // Update plan status
    await prisma.plan.update({
      where: { planId },
      data: {
        status: decision,
      },
    });
    
    // Audit log
    await createAuditLog({
      planId,
      userId: req.user!.sub,
      action: decision === 'APPROVED' ? 'PLAN_APPROVED' : 'PLAN_REJECTED',
      details: { decision, reason },
      ipAddress: req.ip,
      correlationId: req.correlationId,
    });
    
    res.json({
      planId,
      status: decision,
      message: `Plan ${decision.toLowerCase()}`,
    });
  } catch (error: any) {
    console.error('Approve plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /plans/:planId/publish - Publish a plan (Owner only)
 */
router.post('/:planId/publish', authenticate, requireRole('Owner'), async (req: AuthRequest, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await prisma.plan.findUnique({
      where: { planId },
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    if (plan.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only publish DRAFT plans' });
    }
    
    // Update plan status to pending approval
    await prisma.plan.update({
      where: { planId },
      data: {
        status: 'PENDING_APPROVAL',
      },
    });
    
    // Audit log
    await createAuditLog({
      planId,
      userId: req.user!.sub,
      action: 'PLAN_PUBLISHED',
      details: { status: 'PENDING_APPROVAL' },
      ipAddress: req.ip,
      correlationId: req.correlationId,
    });
    
    res.json({
      planId,
      status: 'PENDING_APPROVAL',
      message: 'Plan published for approval',
    });
  } catch (error: any) {
    console.error('Publish plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
