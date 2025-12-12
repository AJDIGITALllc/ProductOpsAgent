import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { planRouter } from './routes/plan';
import { executeRouter } from './routes/execute';
import { runsRouter } from './routes/runs';
import { productsRouter } from './routes/products';
import { templatesRouter } from './routes/templates';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (for demo purposes, in production would require auth)
app.use('/api/plan', planRouter);
app.use('/api/execute', executeRouter);
app.use('/api/runs', runsRouter);
app.use('/api/products', productsRouter);
app.use('/api/templates', templatesRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[API] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[API] Database: ${process.env.DATABASE_URL || 'not configured'}`);
  console.log(`[API] Whop API: ${process.env.WHOP_API_KEY ? 'configured' : 'STUB MODE'}`);
});
