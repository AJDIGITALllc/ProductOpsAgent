import config from '../config.js';
import idempotencyService from './idempotency.js';
import { sendWebhook } from './webhook.js';

/**
 * Execution Service
 * Executes plan actions with idempotency and failure handling
 */

// In-memory plan store (use database in production)
const planStore = new Map();

/**
 * Execute a plan
 * Halts immediately on any failure
 */
export async function executePlan(planId, userId) {
  const plan = planStore.get(planId);
  
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }
  
  if (plan.status === 'EXECUTED') {
    return {
      planId,
      status: 'EXECUTED',
      message: 'Plan already executed',
      completedSteps: plan.completedSteps || [],
      results: plan.results || []
    };
  }
  
  if (plan.status === 'FAILED') {
    return {
      planId,
      status: 'FAILED',
      message: 'Plan previously failed',
      failedStepIndex: plan.failedStepIndex,
      errorMessage: plan.errorMessage,
      completedSteps: plan.completedSteps || []
    };
  }
  
  // Mark as executing
  plan.status = 'EXECUTING';
  plan.executedBy = userId;
  plan.executionStartedAt = new Date().toISOString();
  planStore.set(planId, plan);
  
  const results = [];
  const completedSteps = [];
  
  try {
    // Execute actions sequentially
    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i];
      
      console.log(`Executing action ${i + 1}/${plan.actions.length}: ${action.type}`);
      
      try {
        // Check idempotency
        const idempotencyKey = idempotencyService.generateKey(
          planId, 
          i, 
          action.type, 
          action.params
        );
        
        const idempotencyCheck = idempotencyService.check(idempotencyKey);
        
        if (idempotencyCheck.executed) {
          console.log(`Action ${i} already executed (idempotent)`);
          results.push(idempotencyCheck.result.result);
          completedSteps.push(i);
          continue;
        }
        
        // Execute action
        const result = await executeAction(action, results);
        
        // Mark as executed in idempotency store
        idempotencyService.markExecuted(idempotencyKey, result);
        
        results.push(result);
        completedSteps.push(i);
        
      } catch (error) {
        // FAILURE: Halt immediately
        console.error(`Action ${i} failed:`, error.message);
        
        plan.status = 'FAILED';
        plan.failedStepIndex = i;
        plan.errorMessage = error.message;
        plan.completedSteps = completedSteps;
        plan.results = results;
        plan.executionCompletedAt = new Date().toISOString();
        planStore.set(planId, plan);
        
        // Send failure webhook
        await sendWebhook('plan.failed', {
          planId,
          failedStepIndex: i,
          errorMessage: error.message,
          completedSteps,
          userId
        });
        
        return {
          planId,
          status: 'FAILED',
          failedStepIndex: i,
          errorMessage: error.message,
          completedSteps,
          results
        };
      }
    }
    
    // All actions succeeded
    plan.status = 'EXECUTED';
    plan.completedSteps = completedSteps;
    plan.results = results;
    plan.executionCompletedAt = new Date().toISOString();
    planStore.set(planId, plan);
    
    // Send success webhook
    await sendWebhook('plan.executed', {
      planId,
      completedSteps,
      userId
    });
    
    return {
      planId,
      status: 'EXECUTED',
      completedSteps,
      results
    };
    
  } catch (error) {
    // Unexpected error
    console.error('Unexpected execution error:', error);
    
    plan.status = 'FAILED';
    plan.errorMessage = error.message;
    plan.completedSteps = completedSteps;
    plan.results = results;
    plan.executionCompletedAt = new Date().toISOString();
    planStore.set(planId, plan);
    
    throw error;
  }
}

/**
 * Execute a single action
 */
async function executeAction(action, previousResults) {
  const { type, params } = action;
  
  // In STUB MODE, simulate actions
  if (config.isStubMode()) {
    return executeStubAction(type, params, previousResults);
  }
  
  // Real API calls (to be implemented with Whop API)
  switch (type) {
    case 'create_product':
      return await createProduct(params);
    case 'add_faq':
      return await addFaq(params, previousResults);
    case 'publish':
      return await publishProduct(previousResults);
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

/**
 * Stub action execution for testing without Whop API
 */
function executeStubAction(type, params, previousResults) {
  console.log(`[STUB] Executing ${type} with params:`, params);
  
  switch (type) {
    case 'create_product':
      return {
        type: 'create_product',
        productId: `stub_product_${Date.now()}`,
        name: params.name,
        price: params.price,
        currency: params.currency,
        interval: params.interval,
        status: 'created'
      };
      
    case 'add_faq':
      // Get product ID from previous create_product action
      const createResult = previousResults.find(r => r.type === 'create_product');
      return {
        type: 'add_faq',
        productId: createResult?.productId,
        faqId: `stub_faq_${Date.now()}`,
        question: params.question,
        answer: params.answer,
        status: 'added'
      };
      
    case 'publish':
      const productResult = previousResults.find(r => r.type === 'create_product');
      return {
        type: 'publish',
        productId: productResult?.productId,
        status: 'published',
        publishedAt: new Date().toISOString()
      };
      
    default:
      throw new Error(`Unknown stub action type: ${type}`);
  }
}

/**
 * Real Whop API implementations (placeholders)
 */
async function createProduct(params) {
  // TODO: Implement real Whop API call
  throw new Error('Real Whop API not implemented yet');
}

async function addFaq(params, previousResults) {
  // TODO: Implement real Whop API call
  throw new Error('Real Whop API not implemented yet');
}

async function publishProduct(previousResults) {
  // TODO: Implement real Whop API call
  throw new Error('Real Whop API not implemented yet');
}

/**
 * Store a plan
 */
export function storePlan(plan) {
  planStore.set(plan.planId, plan);
  return plan;
}

/**
 * Get a plan
 */
export function getPlan(planId) {
  return planStore.get(planId);
}

/**
 * Approve a plan
 */
export async function approvePlan(planId, userId) {
  const plan = planStore.get(planId);
  
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }
  
  if (plan.status !== 'PENDING') {
    throw new Error(`Plan ${planId} is not in PENDING status (current: ${plan.status})`);
  }
  
  plan.status = 'APPROVED';
  plan.approvedBy = userId;
  plan.approvedAt = new Date().toISOString();
  planStore.set(planId, plan);
  
  // Send approval webhook
  await sendWebhook('plan.approved', {
    planId,
    userId
  });
  
  return plan;
}

/**
 * Get all plans
 */
export function getAllPlans() {
  return Array.from(planStore.values());
}

/**
 * Clear all plans (for testing)
 */
export function clearPlans() {
  planStore.clear();
}
