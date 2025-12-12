import { Router } from 'express';
import { planService } from '../services/plan.service';
import { z } from 'zod';
import { ActionSchema } from '../types/actions';

const router = Router();

// POST /api/plans - Create a new plan
router.post('/', async (req, res) => {
  try {
    const schema = z.object({
      actions: z.array(ActionSchema),
      productId: z.string().optional(),
    });

    const { actions, productId } = schema.parse(req.body);
    const plan = await planService.createPlan(actions, productId);

    res.status(201).json(plan);
  } catch (error: any) {
    console.error('Error creating plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/plans/:id/approve - Approve a plan
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const plan = await planService.approvePlan(id, approvedBy);
    res.json(plan);
  } catch (error: any) {
    console.error('Error approving plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /api/plans/:id/execute - Execute an approved plan
router.post('/:id/execute', async (req, res) => {
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

// POST /api/plans/:id/cancel - Cancel a pending plan
router.post('/:id/cancel', async (req, res) => {
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
