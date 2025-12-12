import { Router } from 'express';
import { planService } from '../services/plan.service';
import { z } from 'zod';
import { ActionSchema, ActionType } from '../types/actions';
import { requireAuth, requireOwner } from '../middleware/auth.middleware';

const router = Router();

// Helper to check if plan contains publish action
function containsPublishAction(actions: any[]): boolean {
  return actions.some((action) => action.type === ActionType.PUBLISH);
}

// POST /api/plans - Create a new plan (requires auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      actions: z.array(ActionSchema),
      productId: z.string().optional(),
    });

    const { actions, productId } = schema.parse(req.body);
    
    // Check if plan contains publish action and user has owner role
    if (containsPublishAction(actions) && req.user?.role !== 'owner') {
      return res.status(403).json({
        error: 'Only owners can create plans with publish actions',
      });
    }
    
    const plan = await planService.createPlan(actions, productId, req.user?.userId);

    res.status(201).json(plan);
  } catch (error: any) {
    console.error('Error creating plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/plans/:id/approve - Approve a plan (requires auth)
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user?.email || 'unknown';

    // Get plan to check if it contains publish action
    const existingPlan = await planService.getPlan(id);
    if (!existingPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const actions = JSON.parse(existingPlan.actions);
    if (containsPublishAction(actions) && req.user?.role !== 'owner') {
      return res.status(403).json({
        error: 'Only owners can approve plans with publish actions',
      });
    }

    const plan = await planService.approvePlan(id, approvedBy);
    res.json(plan);
  } catch (error: any) {
    console.error('Error approving plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/plans/:id/execute - Execute an approved plan (requires auth)
router.post('/:id/execute', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    const result = await planService.executePlan(id, idempotencyKey);
    res.json(result);
  } catch (error: any) {
    console.error('Error executing plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/plans/:id/cancel - Cancel a pending plan (requires auth)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await planService.cancelPlan(id);
    res.json(plan);
  } catch (error: any) {
    console.error('Error cancelling plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/plans/:id - Get plan details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await planService.getPlan(id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(plan);
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/plans - List all plans
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const plans = await planService.listPlans(status as string);
    res.json(plans);
  } catch (error: any) {
    console.error('Error listing plans:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
