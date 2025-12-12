/**
 * Metrics Router
 * 
 * Exposes read-only metrics endpoint for ops monitoring:
 * - Planner latency
 * - Token usage
 * - Plan size
 * - Execution counts
 * - Daily quotas
 */

const express = require('express');
const { getTelemetry } = require('../../services/telemetry-service');

function createMetricsRouter() {
  const router = express.Router();
  
  // Read-only metrics endpoint
  router.get('/', (req, res) => {
    try {
      const metrics = getTelemetry();
      res.json({
        status: 'ok',
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: error.message
      });
    }
  });
  
  // Specific metric categories
  router.get('/planner', (req, res) => {
    try {
      const metrics = getTelemetry();
      res.json({
        status: 'ok',
        planner: {
          totalCalls: metrics.planner.totalCalls,
          todayCalls: metrics.planner.todayCalls,
          avgLatency: metrics.planner.avgLatencyMs,
          totalTokens: metrics.planner.totalTokens,
          avgPlanSize: metrics.planner.avgPlanSize
        },
        quotas: {
          dailyPlannerQuota: metrics.quotas.dailyPlannerQuota,
          remainingToday: metrics.quotas.dailyPlannerQuota - metrics.planner.todayCalls
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve planner metrics',
        message: error.message
      });
    }
  });
  
  router.get('/execution', (req, res) => {
    try {
      const metrics = getTelemetry();
      res.json({
        status: 'ok',
        execution: {
          totalExecutions: metrics.execution.totalExecutions,
          todayExecutions: metrics.execution.todayExecutions,
          successRate: metrics.execution.successRate
        },
        quotas: {
          dailyExecutionQuota: metrics.quotas.dailyExecutionQuota,
          remainingToday: metrics.quotas.dailyExecutionQuota - metrics.execution.todayExecutions
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve execution metrics',
        message: error.message
      });
    }
  });
  
  router.get('/images', (req, res) => {
    try {
      const metrics = getTelemetry();
      res.json({
        status: 'ok',
        images: {
          totalGenerated: metrics.images.totalGenerated,
          todayGenerated: metrics.images.todayGenerated
        },
        quotas: {
          dailyImageQuota: metrics.quotas.dailyImageQuota,
          remainingToday: metrics.quotas.dailyImageQuota - metrics.images.todayGenerated
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve image metrics',
        message: error.message
      });
    }
  });
  
  return router;
}

module.exports = {
  createMetricsRouter
};
