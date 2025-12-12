import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/templates
 * List all templates
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const formattedTemplates = templates.map((template) => ({
      ...template,
      actionPlan: template.actionPlan ? JSON.parse(template.actionPlan) : null,
    }));

    res.json({ templates: formattedTemplates });
  } catch (error: any) {
    console.error('Templates list error:', error);
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

/**
 * GET /api/templates/:id
 * Get a specific template by ID
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse JSON fields
    const formattedTemplate = {
      ...template,
      actionPlan: template.actionPlan ? JSON.parse(template.actionPlan) : null,
    };

    res.json(formattedTemplate);
  } catch (error: any) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch template', details: error.message });
  }
});

export { router as templatesRouter };
