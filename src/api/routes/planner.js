/**
 * Planner Router
 * 
 * Handles plan generation and execution requests
 */

const express = require('express');
const { generatePlan, executePlan } = require('../../services/planner-service');

function createPlannerRouter() {
  const router = express.Router();
  
  // Generate a plan from user input
  router.post('/generate', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      const plan = await generatePlan(prompt, req.requestId);
      
      res.json({
        status: 'ok',
        plan,
        requestId: req.requestId
      });
    } catch (error) {
      console.error(`[${req.requestId}] Plan generation failed:`, error.message);
      res.status(500).json({
        error: 'Plan generation failed',
        message: error.message,
        requestId: req.requestId
      });
    }
  });
  
  // Execute a plan
  router.post('/execute', async (req, res) => {
    try {
      const { planId, dryRun } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required' });
      }
      
      const result = await executePlan(planId, dryRun, req.requestId);
      
      res.json({
        status: 'ok',
        result,
        requestId: req.requestId
      });
    } catch (error) {
      console.error(`[${req.requestId}] Plan execution failed:`, error.message);
      res.status(500).json({
        error: 'Plan execution failed',
        message: error.message,
        requestId: req.requestId
      });
    }
  });
  
  return router;
}

module.exports = {
  createPlannerRouter
};
