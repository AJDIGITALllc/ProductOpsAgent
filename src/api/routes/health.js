/**
 * Health Check Router
 * 
 * Provides health check endpoint for monitoring and load balancers
 */

const express = require('express');

function createHealthRouter() {
  const router = express.Router();
  
  router.get('/', (req, res) => {
    const plannerMode = process.env.PLANNER_MODE;
    const executionDisabled = process.env.EXECUTION_DISABLED === 'true';
    
    res.json({
      status: 'healthy',
      mode: plannerMode || 'unknown',
      executionEnabled: !executionDisabled,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });
  
  return router;
}

module.exports = {
  createHealthRouter
};
