import { WhopClient } from '@productopsagent/whop';
import type { Action, ActionResult } from '@productopsagent/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ExecutorService executes validated action plans with guardrails
 */
export class ExecutorService {
  private whopClient: WhopClient;

  constructor() {
    this.whopClient = new WhopClient(process.env.WHOP_API_KEY);
  }

  /**
   * Execute an action plan in order
   */
  async executeActions(runId: string, actions: Action[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    const productIdMap = new Map<string, string>(); // Local ID -> Whop ID

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      const result = await this.executeAction(action, productIdMap);
      results.push(result);

      // Update action status in database
      await prisma.action.upsert({
        where: { idempotencyKey: action.idempotencyKey },
        update: {
          status: result.status,
          result: result.result ? JSON.stringify(result.result) : null,
          error: result.error,
          completedAt: result.completedAt,
        },
        create: {
          id: action.id,
          runId,
          actionType: action.type,
          params: JSON.stringify(action.params),
          idempotencyKey: action.idempotencyKey,
          order: action.order,
          status: result.status,
          result: result.result ? JSON.stringify(result.result) : null,
          error: result.error,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
        },
      });

      // If action failed, stop execution
      if (result.status === 'failed') {
        // Mark remaining actions as skipped
        for (const remainingAction of sortedActions.slice(sortedActions.indexOf(action) + 1)) {
          results.push({
            actionId: remainingAction.id,
            status: 'skipped',
          });
        }
        break;
      }
    }

    return results;
  }

  private async executeAction(
    action: Action,
    productIdMap: Map<string, string>
  ): Promise<ActionResult> {
    const result: ActionResult = {
      actionId: action.id,
      status: 'executing',
      startedAt: new Date(),
    };

    try {
      switch (action.type) {
        case 'whop.product.create': {
          const response = await this.whopClient.createProduct(
            action.params,
            action.idempotencyKey
          );
          productIdMap.set(action.params.productId || action.id, response.id);
          
          // Store in database
          await prisma.product.create({
            data: {
              id: action.id,
              whopProductId: response.id,
              name: action.params.name,
              status: action.params.status || 'draft',
              createdBy: 'system', // TODO: Get from run context
            },
          });

          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.update_name': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.updateProductName(
            whopId,
            action.params.name,
            action.idempotencyKey
          );
          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.set_pricing': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.setProductPricing(
            whopId,
            action.params.pricing,
            action.idempotencyKey
          );
          
          // Update database
          await prisma.product.updateMany({
            where: { id: action.params.productId },
            data: { pricing: JSON.stringify(action.params.pricing) },
          });

          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.set_description': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.setProductDescription(
            whopId,
            action.params.description,
            action.idempotencyKey
          );
          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.set_faqs': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.setProductFAQs(
            whopId,
            action.params.faqs,
            action.idempotencyKey
          );
          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.set_payment_options': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.setPaymentOptions(
            whopId,
            action.params.paymentOptions,
            action.idempotencyKey
          );
          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.publish': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.publishProduct(whopId, action.idempotencyKey);
          
          // Update database
          await prisma.product.updateMany({
            where: { id: action.params.productId },
            data: { status: 'published' },
          });

          result.result = response;
          result.status = 'completed';
          break;
        }

        case 'whop.product.get': {
          const whopId = productIdMap.get(action.params.productId) || action.params.productId;
          const response = await this.whopClient.getProduct(whopId);
          result.result = response;
          result.status = 'completed';
          break;
        }

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error: any) {
      console.error(`Action ${action.id} failed:`, error);
      result.status = 'failed';
      result.error = error.message || 'Unknown error';
    }

    result.completedAt = new Date();
    return result;
  }
}
