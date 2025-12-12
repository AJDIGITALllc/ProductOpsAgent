import express from 'express';
import config from './config.js';
import { requestLogger } from './middleware/logger.js';
import { rateLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import planRoutes from './routes/plans.js';

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// CORS for UI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    stubMode: config.isStubMode(),
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/plans', rateLimiter, planRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(config.port, () => {
  console.log('=================================================');
  console.log('  ProductOpsAgent Server');
  console.log('=================================================');
  console.log(`  Port: ${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Stub Mode: ${config.isStubMode() ? 'YES ⚠️' : 'NO'}`);
  console.log(`  Webhooks: ${config.webhookUrl ? 'Enabled' : 'Disabled'}`);
  console.log('=================================================');
});
