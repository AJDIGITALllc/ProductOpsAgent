import { prisma } from '@product-ops-agent/database';
import { whopClient } from '../integrations/whop/WhopClient';
import { ActionPlan, ExecutionResult, ActionType } from '../types';
import {
  generateIdempotencyKey,
  checkIdempotency,
  storeIdempotencyKeyProcessing,
  updateIdempotencyKeyResult,
} from './idempotency';
import { createAuditLog } from './audit';
import { enqueueWebhook } from './webhooks';

/**
 * Execute a single action with idempotency
 */
async function executeAction(
  planId: string,
  actionIndex: number,
  actionType: ActionType,
  payload: any,
  userId?: string,
  correlationId?: string
): Promise<any> {
  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(planId, actionIndex, actionType, payload);
  
  // Check if already executed
  const idempotencyCheck = await checkIdempotency(idempotencyKey);
  if (idempotencyCheck.exists) {
    if (idempotencyCheck.status === 'COMPLETED') {
      console.log(`Action already executed (idempotent): ${idempotencyKey}`);
      return idempotencyCheck.result;
    }
    if (idempotencyCheck.status === 'PROCESSING') {
      throw new Error('Action is currently being processed by another request');
    }
    if (idempotencyCheck.status === 'FAILED') {
      // Allow retry of failed actions
      console.log(`Retrying previously failed action: ${idempotencyKey}`);
    }
  }
  
  // Store idempotency key as PROCESSING
  if (!idempotencyCheck.exists) {
    await storeIdempotencyKeyProcessing(idempotencyKey, planId, actionIndex);
  }
  
  try {
    let result;
    
    // Execute action based on type
    switch (actionType) {
      case 'CREATE_PRODUCT':
        result = await whopClient.client.createProduct(payload);
        break;
      case 'UPDATE_PRODUCT':
        result = await whopClient.client.updateProduct(payload);
        break;
      case 'DELETE_PRODUCT':
        await whopClient.client.deleteProduct(payload);
        result = { success: true };
        break;
      case 'ADD_FAQ':
        result = await whopClient.client.addFAQ(payload);
        break;
      case 'UPDATE_FAQ':
        result = await whopClient.client.updateFAQ(payload);
        break;
      case 'DELETE_FAQ':
        await whopClient.client.deleteFAQ(payload);
        result = { success: true };
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
    
    // Update action status
    await prisma.action.updateMany({
      where: { planId, actionIndex },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify(result),
      },
    });
    
    // Store idempotency result
    await updateIdempotencyKeyResult(idempotencyKey, 'COMPLETED', result);
    
    // Audit log
    await createAuditLog({
      planId,
      userId,
      action: 'ACTION_EXECUTED',
      details: { actionIndex, actionType, result },
      correlationId,
    });
    
    return result;
  } catch (error: any) {
    // Update action status
    await prisma.action.updateMany({
      where: { planId, actionIndex },
      data: {
        status: 'FAILED',
        result: JSON.stringify({ error: error.message }),
      },
    });
    
    // Store idempotency result
    await updateIdempotencyKeyResult(idempotencyKey, 'FAILED', { error: error.message });
    
    // Audit log
    await createAuditLog({
      planId,
      userId,
      action: 'ACTION_FAILED',
      details: { actionIndex, actionType, error: error.message },
      correlationId,
    });
    
    throw error;
  }
}

/**
 * Execute an entire action plan
 */
export async function executePlan(
  plan: ActionPlan,
  userId?: string,
  correlationId?: string
): Promise<ExecutionResult> {
  const { planId, actions } = plan;
  
  // Create execution record
  const execution = await prisma.execution.create({
    data: {
      planId,
      status: 'RUNNING',
    },
  });
  
  const results: any[] = [];
  let failedStepIndex: number | undefined;
  
  try {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      try {
        const result = await executeAction(
          planId,
          i,
          action.type,
          action.payload,
          userId,
          correlationId
        );
        results.push(result);
      } catch (error: any) {
        failedStepIndex = i;
        results.push({ error: error.message });
        
        // Update execution as failed
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            failedStepIndex: i,
            resultJson: JSON.stringify(results),
            errorMessage: error.message,
          },
        });
        
        // Queue webhook for failure
        await enqueueWebhook(planId, 'PLAN_FAILED', {
          planId,
          failedStepIndex: i,
          error: error.message,
          results,
        });
        
        return {
          planId,
          status: 'FAILED',
          completedSteps: i,
          failedStepIndex: i,
          results,
          error: error.message,
        };
      }
    }
    
    // Update execution as completed
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultJson: JSON.stringify(results),
      },
    });
    
    // Queue webhook for success
    await enqueueWebhook(planId, 'PLAN_COMPLETED', {
      planId,
      results,
    });
    
    return {
      planId,
      status: 'COMPLETED',
      completedSteps: actions.length,
      results,
    };
  } catch (error: any) {
    // Unexpected error
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        failedStepIndex,
        resultJson: JSON.stringify(results),
        errorMessage: error.message,
      },
    });
    
    throw error;
  }
}
