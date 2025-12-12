import { processWebhooks } from '../services/webhooks';

const WORKER_INTERVAL_MS = 5000; // Check every 5 seconds

/**
 * Start the webhook delivery worker
 */
export function startWebhookWorker(): NodeJS.Timeout {
  console.log('Starting webhook delivery worker...');
  
  const intervalId = setInterval(async () => {
    try {
      await processWebhooks();
    } catch (error) {
      console.error('Webhook worker error:', error);
    }
  }, WORKER_INTERVAL_MS);
  
  // Process immediately on start
  processWebhooks().catch(error => {
    console.error('Initial webhook processing error:', error);
  });
  
  return intervalId;
}

/**
 * Stop the webhook delivery worker
 */
export function stopWebhookWorker(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('Webhook delivery worker stopped');
}
