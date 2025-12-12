import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generatePlan, ValidationError } from '../services/planGenerator.js';
import { storePlan, getPlan, getAllPlans, approvePlan, executePlan } from '../services/executor.js';
import { sendWebhook } from '../services/webhook.js';
import config from '../config.js';

const router = express.Router();

/**
 * GET /plans/stub-mode
 * Check if server is in stub mode
 */
router.get('/stub-mode', (req, res) => {
  res.json({
    stubMode: config.isStubMode()
  });
});

/**
 * POST /plans/create
 * Create a new plan
 * Protected: Requires authentication
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const input = req.body;
    
    // Generate deterministic plan
    const plan = generatePlan(input);
    
    // Store plan
    storePlan(plan);
    
    // Send webhook
    await sendWebhook('plan.created', {
      planId: plan.planId,
      userId: req.user.userId,
      actionCount: plan.actions.length
    });
    
    res.status(201).json({
      success: true,
      plan
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    
    console.error('Error creating plan:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /plans/:planId
 * Get a specific plan
 * Protected: Requires authentication
 */
router.get('/:planId', authenticate, (req, res) => {
  try {
    const { planId } = req.params;
    const plan = getPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Plan ${planId} not found`
      });
    }
    
    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /plans
 * Get all plans
 * Protected: Requires authentication
 */
router.get('/', authenticate, (req, res) => {
  try {
    const plans = getAllPlans();
    
    res.json({
      success: true,
      plans,
      count: plans.length
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /plans/:planId/approve
 * Approve a plan
 * Protected: Requires authentication
 */
router.post('/:planId/approve', authenticate, async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await approvePlan(planId, req.user.userId);
    
    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error approving plan:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    res.status(400).json({
      error: 'Bad Request',
      message: error.message
    });
  }
});

/**
 * POST /plans/:planId/execute
 * Execute a plan
 * Protected: Requires authentication AND Owner role for publish actions
 */
router.post('/:planId/execute', authenticate, async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = getPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Plan ${planId} not found`
      });
    }
    
    // Check if plan contains publish action
    const hasPublishAction = plan.actions.some(action => action.type === 'publish');
    
    // If plan has publish action, require Owner role
    if (hasPublishAction && req.user.role !== 'Owner') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Publish action requires Owner role'
      });
    }
    
    // Execute plan
    const result = await executePlan(planId, req.user.userId);
    
    res.json({
      success: result.status === 'EXECUTED',
      result
    });
  } catch (error) {
    console.error('Error executing plan:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

export default router;
