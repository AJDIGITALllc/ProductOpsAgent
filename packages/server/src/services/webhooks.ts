import { prisma } from '@product-ops-agent/database';
import axios from 'axios';

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const WEBHOOK_MAX_RETRIES = parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10);
const WEBHOOK_RETRY_DELAY_MS = parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '1000', 10);
const WEBHOOK_RETRY_BACKOFF_MULTIPLIER = parseFloat(process.env.WEBHOOK_RETRY_BACKOFF_MULTIPLIER || '2');

/**
 * Enqueue a webhook for delivery
 */
export async function enqueueWebhook(
  planId: string,
  eventType: string,
  payload: any
): Promise<void> {
  if (!WEBHOOK_URL) {
    console.log('No webhook URL configured, skipping webhook delivery');
    return;
  }
  
  await prisma.webhookDelivery.create({
    data: {
      planId,
      eventType,
      payload: JSON.stringify(payload),
      url: WEBHOOK_URL,
      status: 'PENDING',
      maxAttempts: WEBHOOK_MAX_RETRIES,
      nextRetryAt: new Date(),
    },
  });
}

/**
 * Process pending webhooks
 */
export async function processWebhooks(): Promise<void> {
  const now = new Date();
  
  // Get pending webhooks ready for delivery
  const pendingWebhooks = await prisma.webhookDelivery.findMany({
    where: {
      status: {
        in: ['PENDING', 'FAILED'],
      },
      attempts: {
        lt: WEBHOOK_MAX_RETRIES,
      },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
    },
    take: 10,
  });
  
  for (const webhook of pendingWebhooks) {
    await deliverWebhook(webhook.id);
  }
}

/**
 * Deliver a single webhook
 */
async function deliverWebhook(webhookId: string): Promise<void> {
  const webhook = await prisma.webhookDelivery.findUnique({
    where: { id: webhookId },
  });
  
  if (!webhook) {
    return;
  }
  
  const attemptNumber = webhook.attempts + 1;
  
  try {
    const response = await axios.post(webhook.url, JSON.parse(webhook.payload), {
      headers: {
        'Content-Type': 'application/json',
        'X-Event-Type': webhook.eventType,
        'X-Plan-Id': webhook.planId,
      },
      timeout: 10000,
    });
    
    // Success
    await prisma.webhookDelivery.update({
      where: { id: webhookId },
      data: {
        status: 'DELIVERED',
        attempts: attemptNumber,
        lastAttemptAt: new Date(),
        deliveredAt: new Date(),
      },
    });
    
    await prisma.webhookAttempt.create({
      data: {
        webhookDeliveryId: webhookId,
        attemptNumber,
        status: 'SUCCESS',
        httpStatus: response.status,
      },
    });
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    const httpStatus = error.response?.status || null;
    
    // Calculate next retry time with exponential backoff
    const delay = WEBHOOK_RETRY_DELAY_MS * Math.pow(WEBHOOK_RETRY_BACKOFF_MULTIPLIER, attemptNumber - 1);
    const nextRetryAt = new Date(Date.now() + delay);
    
    const isDead = attemptNumber >= webhook.maxAttempts;
    
    await prisma.webhookDelivery.update({
      where: { id: webhookId },
      data: {
        status: isDead ? 'DEAD' : 'FAILED',
        attempts: attemptNumber,
        lastAttemptAt: new Date(),
        nextRetryAt: isDead ? null : nextRetryAt,
        errorMessage,
      },
    });
    
    await prisma.webhookAttempt.create({
      data: {
        webhookDeliveryId: webhookId,
        attemptNumber,
        status: 'FAILED',
        httpStatus,
        errorMessage,
      },
    });
  }
}

/**
 * Get webhook delivery status for a plan
 */
export async function getWebhookStatus(planId: string) {
  return prisma.webhookDelivery.findMany({
    where: { planId },
    include: {
      attempts_history: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
