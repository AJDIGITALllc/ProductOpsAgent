import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import plansRoutes from './routes/plans.routes';
import productsRoutes from './routes/products.routes';
import templatesRoutes from './routes/templates.routes';
import auditRoutes from './routes/audit.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const { whopClient } = require('./integrations/whop/WhopClient');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    whopApiMode: whopClient.isStubMode() ? 'stub' : 'real',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/audit', auditRoutes);

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📝 API base: http://localhost:${port}/api`);
  
  if (!process.env.WHOP_API_KEY) {
    console.log('⚠️  WHOP_API_KEY not set - running in STUB mode');
  }
});
