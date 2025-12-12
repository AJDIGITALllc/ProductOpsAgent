import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PlannerService } from '../services/planner';
import { ActionPlanSchema, validateActionParams } from '@productopsagent/shared';
import jwt from 'jsonwebtoken';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const planner = new PlannerService();

/**
 * POST /api/plan
 * Generate a deterministic action plan from a user prompt
 * Does not make any external changes
 */
router.post('/', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get actor ID (user or anonymous)
    const actorId = req.user?.id || 'anonymous';

    // Generate plan
    const actionPlan = planner.generatePlan(prompt, actorId);

    // Validate the plan
    try {
      ActionPlanSchema.parse(actionPlan);
      
      // Validate each action's params
      for (const action of actionPlan.actions) {
        validateActionParams(action);
      }
    } catch (validationError: any) {
      return res.status(400).json({
        error: 'Invalid action plan',
        details: validationError.message,
      });
    }

    // Create run in database
    const run = await prisma.run.create({
      data: {
        status: 'planned',
        userPrompt: prompt,
        actionPlan: JSON.stringify(actionPlan),
        actorId,
        results: '[]',
      },
    });

    // Generate approval token
    const secret = process.env.JWT_SECRET || process.env.APP_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or APP_SECRET not configured');
    }

    const approvalToken = jwt.sign(
      {
        runId: run.id,
        planId: actionPlan.id,
        actorId,
      },
      secret,
      { expiresIn: '1h' }
    );

    // Update run with approval token
    await prisma.run.update({
      where: { id: run.id },
      data: { approvalToken },
    });

    res.json({
      runId: run.id,
      actionPlan,
      approvalToken,
    });
  } catch (error: any) {
    console.error('Plan error:', error);
    res.status(500).json({
      error: 'Failed to generate plan',
      details: error.message,
    });
  }
});

export { router as planRouter };
