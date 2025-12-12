import { Router } from 'express';
import { auditService } from '../services/audit.service';

const router = Router();

// GET /api/audit - Get all audit logs
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    const logs = await auditService.getAllLogs(
      limit ? parseInt(limit as string) : 100
    );
    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/audit/product/:productId - Get logs for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const logs = await auditService.getLogsForProduct(productId);
    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching product audit logs:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/audit/plan/:planId - Get logs for a plan
router.get('/plan/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const logs = await auditService.getLogsForPlan(planId);
    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching plan audit logs:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
