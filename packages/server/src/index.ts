import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { correlationIdMiddleware } from './middleware/correlationId';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { optionalAuth } from './middleware/auth';
import healthRouter from './routes/health';
import plansRouter from './routes/plans';
import executeRouter from './routes/execute';
import adminRouter from './routes/admin';
import { startWebhookWorker } from './workers/webhookWorker';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(correlationIdMiddleware);

// Optional auth for logging (doesn't block requests)
app.use(optionalAuth);

// Rate limiting
app.use(rateLimitMiddleware);

// Request logging
app.use((req, res, next) => {
  const authReq = req as any;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${authReq.user?.sub || 'anonymous'} - CorrelationId: ${authReq.correlationId}`);
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/plans', plansRouter);
app.use('/execute', executeRouter);
app.use('/admin', adminRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start webhook worker
let webhookWorkerInterval: NodeJS.Timeout | null = null;
if (process.env.WEBHOOK_URL) {
  webhookWorkerInterval = startWebhookWorker();
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`ProductOpsAgent server listening on port ${PORT}`);
  console.log(`Planner mode: ${process.env.PLANNER_MODE || 'RULES'}`);
  console.log(`Whop mode: ${process.env.WHOP_API_KEY ? 'REAL' : 'STUB'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (webhookWorkerInterval) {
    clearInterval(webhookWorkerInterval);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
