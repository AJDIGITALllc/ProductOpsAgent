import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/runs
 * List all runs (recent first)
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const runs = await prisma.run.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const formattedRuns = runs.map((run) => ({
      ...run,
      actionPlan: run.actionPlan ? JSON.parse(run.actionPlan) : null,
      results: run.results ? JSON.parse(run.results) : [],
    }));

    res.json({ runs: formattedRuns, total: runs.length });
  } catch (error: any) {
    console.error('Runs list error:', error);
    res.status(500).json({ error: 'Failed to fetch runs', details: error.message });
  }
});

/**
 * GET /api/runs/:id
 * Get a specific run by ID
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const run = await prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Parse JSON fields
    const formattedRun = {
      ...run,
      actionPlan: run.actionPlan ? JSON.parse(run.actionPlan) : null,
      results: run.results ? JSON.parse(run.results) : [],
    };

    res.json(formattedRun);
  } catch (error: any) {
    console.error('Run fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch run', details: error.message });
  }
});

export { router as runsRouter };
