import { Router } from 'express';
import { prisma } from '@product-ops-agent/database';

const router = Router();

// GET /api/templates - List all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.productTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    // Parse config for each template
    const formatted = templates.map((template) => ({
      ...template,
      config: JSON.parse(template.config),
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error listing templates:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/templates/:id - Get template details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.productTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const formatted = {
      ...template,
      config: JSON.parse(template.config),
    };

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching template:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
