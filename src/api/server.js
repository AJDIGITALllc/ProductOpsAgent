/**
 * API Server
 * 
 * Configures and starts the Express API server with:
 * - Strict CORS (UI → API only)
 * - HSTS headers
 * - Secure cookies
 * - Environment separation (dev/staging/prod)
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createMetricsRouter } = require('./routes/metrics');
const { createHealthRouter } = require('./routes/health');
const { createPlannerRouter } = require('./routes/planner');
const { createWebhookRouter } = require('./routes/webhook');

function createApp() {
  const app = express();
  const env = process.env.NODE_ENV || 'development';
  
  // Validate cookie secret in production
  const cookieSecret = process.env.COOKIE_SECRET;
  if (env === 'production' && !cookieSecret) {
    throw new Error('COOKIE_SECRET is required in production environment');
  }
  
  // Security headers (including HSTS)
  app.use(helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // CORS configuration - strict UI → API only
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || process.env.UI_URL || 'https://ops.audiojones.com',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 86400 // 24 hours
  };
  
  app.use(cors(corsOptions));
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Cookie parsing with secure settings
  // Use development fallback only in non-production
  const secret = cookieSecret || (env === 'development' ? 'dev-secret-change-in-prod' : '');
  app.use(cookieParser(secret));
  
  // Request logging middleware
  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
    req.requestId = requestId;
    console.log(`[${requestId}] ${req.method} ${req.path}`);
    next();
  });
  
  // Health check endpoint (no auth required)
  app.use('/health', createHealthRouter());
  
  // Metrics endpoint (read-only)
  app.use('/metrics', createMetricsRouter());
  
  // Planner endpoints
  app.use('/api/planner', createPlannerRouter());
  
  // Webhook endpoints
  app.use('/api/webhooks', createWebhookRouter());
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error(`[${req.requestId}] Error:`, err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      requestId: req.requestId
    });
  });
  
  return app;
}

async function startServer() {
  const app = createApp();
  const port = process.env.PORT || 3000;
  const env = process.env.NODE_ENV || 'development';
  
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ API server listening on port ${port} (${env})`);
        resolve(server);
      }
    });
  });
}

module.exports = {
  createApp,
  startServer
};
