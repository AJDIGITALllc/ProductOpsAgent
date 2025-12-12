/**
 * Planner Service
 * 
 * Handles plan generation and execution with telemetry and quota enforcement
 */

const { v4: uuidv4 } = require('uuid');
const {
  recordPlannerCall,
  checkPlannerQuota,
  recordExecution,
  checkExecutionQuota,
  checkExecutionEnabled
} = require('./telemetry-service');
const { getConnector } = require('../connectors/connector-factory');

// In-memory plan storage (would be DB in production)
const plans = new Map();

/**
 * Generate a plan from user prompt
 */
async function generatePlan(prompt, requestId) {
  const startTime = Date.now();
  
  try {
    // Check planner quota before proceeding
    checkPlannerQuota();
    
    console.log(`[${requestId}] Generating plan for prompt: "${prompt.substring(0, 50)}..."`);
    
    const plannerMode = process.env.PLANNER_MODE;
    
    // Parse the prompt to extract actions
    const actions = parsePrompt(prompt);
    
    const plan = {
      id: uuidv4(),
      prompt,
      actions,
      status: 'pending',
      createdAt: new Date().toISOString(),
      plannerMode,
      metadata: {
        requestId
      }
    };
    
    // Store the plan
    plans.set(plan.id, plan);
    
    // Record telemetry
    const latency = Date.now() - startTime;
    const tokens = estimateTokens(prompt); // Simplified
    const planSize = actions.length;
    
    recordPlannerCall(latency, tokens, planSize);
    
    console.log(`[${requestId}] ✓ Plan generated: ${plan.id} (${actions.length} actions)`);
    
    return plan;
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Plan generation failed after ${latency}ms:`, error.message);
    throw error;
  }
}

/**
 * Execute a plan
 */
async function executePlan(planId, dryRun = false, requestId) {
  const plan = plans.get(planId);
  
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }
  
  if (!dryRun) {
    // Check execution quota and enabled status
    checkExecutionQuota();
    checkExecutionEnabled();
  }
  
  console.log(`[${requestId}] ${dryRun ? 'Dry-run' : 'Executing'} plan: ${planId}`);
  
  const results = [];
  let success = true;
  
  try {
    for (const action of plan.actions) {
      console.log(`[${requestId}] Executing action: ${action.type}`);
      
      if (!dryRun) {
        const result = await executeAction(action, requestId);
        results.push(result);
        
        if (!result.success) {
          success = false;
          break;
        }
      } else {
        results.push({
          action: action.type,
          status: 'dry-run',
          success: true
        });
      }
    }
    
    // Record execution telemetry (only for real executions)
    if (!dryRun) {
      recordExecution(success);
    }
    
    plan.status = success ? 'completed' : 'failed';
    plan.results = results;
    plan.executedAt = new Date().toISOString();
    
    console.log(`[${requestId}] ✓ Plan execution ${success ? 'completed' : 'failed'}`);
    
    return {
      planId,
      status: plan.status,
      results,
      dryRun
    };
  } catch (error) {
    if (!dryRun) {
      recordExecution(false);
    }
    plan.status = 'failed';
    plan.error = error.message;
    throw error;
  }
}

/**
 * Execute a single action using the appropriate connector
 */
async function executeAction(action, requestId) {
  const connector = getConnector(action.connector || 'whop');
  
  try {
    let result;
    
    switch (action.type) {
      case 'create_product':
        result = await connector.createProduct(action.params);
        break;
      case 'update_pricing':
        result = await connector.updatePricing(action.params);
        break;
      case 'set_description':
        result = await connector.setDescription(action.params);
        break;
      case 'add_faqs':
        result = await connector.addFAQs(action.params);
        break;
      case 'set_image':
        result = await connector.setImage(action.params);
        break;
      case 'add_media':
        result = await connector.addMedia(action.params);
        break;
      case 'publish':
        result = await connector.publish(action.params);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
    
    return {
      action: action.type,
      success: true,
      result
    };
  } catch (error) {
    console.error(`[${requestId}] ❌ Action failed: ${action.type}:`, error.message);
    return {
      action: action.type,
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse user prompt into actions
 * This is a simplified version - would use LLM in production
 */
function parsePrompt(prompt) {
  const actions = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // Detect create product
  if (lowerPrompt.includes('create') && lowerPrompt.includes('product')) {
    const nameMatch = prompt.match(/(?:called|named)\s+["']?([^"',]+)["']?/i);
    actions.push({
      type: 'create_product',
      params: {
        name: nameMatch ? nameMatch[1].trim() : 'New Product'
      }
    });
  }
  
  // Detect pricing
  if (lowerPrompt.includes('price')) {
    const priceMatch = prompt.match(/\$?(\d+(?:\.\d{2})?)/);
    const recurring = lowerPrompt.includes('recurring') || lowerPrompt.includes('subscription');
    actions.push({
      type: 'update_pricing',
      params: {
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        recurring
      }
    });
  }
  
  // Detect FAQs
  if (lowerPrompt.includes('faq')) {
    actions.push({
      type: 'add_faqs',
      params: {
        faqs: []
      }
    });
  }
  
  return actions;
}

/**
 * Estimate token count (simplified)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

module.exports = {
  generatePlan,
  executePlan
};
