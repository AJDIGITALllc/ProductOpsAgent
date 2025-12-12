import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExecutorService } from '../services/executor';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const executor = new ExecutorService();

/**
 * POST /api/execute
 * Execute an approved action plan
 * Requires approval token from the plan endpoint
 */
router.post('/', async (req, res) => {
  try {
    const { runId, approvalToken } = req.body;

    if (!runId || !approvalToken) {
      return res.status(400).json({ error: 'runId and approvalToken are required' });
    }

    // Verify approval token
    const secret = process.env.JWT_SECRET || process.env.APP_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or APP_SECRET not configured');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(approvalToken, secret);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired approval token' });
    }

    if (decoded.runId !== runId) {
      return res.status(401).json({ error: 'Approval token does not match runId' });
    }

    // Get run from database
    const run = await prisma.run.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (run.status === 'completed') {
      return res.status(400).json({ error: 'Run already completed' });
    }

    if (run.status === 'executing') {
      return res.status(400).json({ error: 'Run is already executing' });
    }

    if (!run.actionPlan) {
      return res.status(400).json({ error: 'Run has no action plan' });
    }

    // Update status to executing
    await prisma.run.update({
      where: { id: runId },
      data: { status: 'executing' },
    });

    // Parse action plan
    const actionPlan = JSON.parse(run.actionPlan);

    // Execute actions
    const results = await executor.executeActions(runId, actionPlan.actions);

    // Determine final status
    const hasFailure = results.some((r) => r.status === 'failed');
    const finalStatus = hasFailure ? 'failed' : 'completed';

    // Update run with results
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: finalStatus,
        results: JSON.stringify(results),
        completedAt: new Date(),
      },
    });

    res.json({
      runId,
      status: finalStatus,
      results,
    });
  } catch (error: any) {
    console.error('Execute error:', error);

    // Try to mark run as failed
    if (req.body.runId) {
      try {
        await prisma.run.update({
          where: { id: req.body.runId },
          data: {
            status: 'failed',
            results: JSON.stringify([
              {
                actionId: 'system',
                status: 'failed',
                error: error.message,
              },
            ]),
          },
        });
      } catch (updateError) {
        console.error('Failed to update run status:', updateError);
      }
    }

    res.status(500).json({
      error: 'Failed to execute plan',
      details: error.message,
    });
  }
});

export { router as executeRouter };
