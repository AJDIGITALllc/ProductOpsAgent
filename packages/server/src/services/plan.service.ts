import { prisma } from '@product-ops-agent/database';
import { Action } from '../types/actions';
import { actionService } from './action.service';
import { auditService } from './audit.service';
import { idempotencyService } from './idempotency.service';

export class PlanService {
  // Create a new plan (PLAN phase)
  async createPlan(actions: Action[], productId?: string): Promise<any> {
    // Validate all actions
    actions.forEach((action) => actionService.validateAction(action));

    const plan = await prisma.plan.create({
      data: {
        productId,
        actions: JSON.stringify(actions),
        status: 'pending',
      },
    });

    await auditService.log({
      action: 'CREATE_PLAN',
      planId: plan.id,
      productId,
      details: JSON.stringify({ actionCount: actions.length }),
      status: 'success',
    });

    return plan;
  }

  // Approve a plan (APPROVE phase)
  async approvePlan(planId: string, approvedBy: string = 'system'): Promise<any> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.status !== 'pending') {
      throw new Error(`Cannot approve plan with status: ${plan.status}`);
    }

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'APPROVE_PLAN',
      planId,
      productId: plan.productId || undefined,
      details: JSON.stringify({ approvedBy }),
      status: 'success',
    });

    return updated;
  }

  // Execute an approved plan (EXECUTE phase)
  async executePlan(
    planId: string,
    idempotencyKey?: string
  ): Promise<any> {
    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await idempotencyService.check(idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.status !== 'approved') {
      throw new Error(`Cannot execute plan with status: ${plan.status}`);
    }

    const actions: Action[] = JSON.parse(plan.actions);
    const results: any[] = [];
    let hasError = false;

    // Execute actions sequentially
    for (const action of actions) {
      try {
        const result = await actionService.executeAction(action, planId);
        results.push({
          actionType: action.type,
          success: true,
          data: result,
        });
      } catch (error: any) {
        hasError = true;
        results.push({
          actionType: action.type,
          success: false,
          error: error.message,
        });
        
        await auditService.log({
          action: 'EXECUTE_PLAN_ACTION_FAILED',
          planId,
          productId: plan.productId || undefined,
          details: JSON.stringify({ action, error: error.message }),
          status: 'failed',
          error: error.message,
        });

        // Stop execution on first error
        break;
      }
    }

    // Update plan status
    const finalStatus = hasError ? 'failed' : 'executed';
    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        status: finalStatus,
        executedAt: new Date(),
        error: hasError ? JSON.stringify(results) : null,
      },
    });

    await auditService.log({
      action: 'EXECUTE_PLAN',
      planId,
      productId: plan.productId || undefined,
      details: JSON.stringify({ resultsCount: results.length }),
      status: finalStatus === 'executed' ? 'success' : 'failed',
    });

    const response = {
      success: !hasError,
      planId,
      results,
    };

    // Store in idempotency cache if key provided
    if (idempotencyKey) {
      await idempotencyService.store(
        idempotencyKey,
        'EXECUTE_PLAN',
        response,
        !hasError
      );
    }

    return response;
  }

  // Get plan details
  async getPlan(planId: string) {
    return prisma.plan.findUnique({
      where: { id: planId },
      include: {
        product: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // List all plans
  async listPlans(status?: string) {
    return prisma.plan.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  // Cancel a pending plan
  async cancelPlan(planId: string): Promise<any> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.status !== 'pending') {
      throw new Error(`Cannot cancel plan with status: ${plan.status}`);
    }

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        status: 'cancelled',
      },
    });

    await auditService.log({
      action: 'CANCEL_PLAN',
      planId,
      productId: plan.productId || undefined,
      details: JSON.stringify({}),
      status: 'success',
    });

    return updated;
  }
}

export const planService = new PlanService();
