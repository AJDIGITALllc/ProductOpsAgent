import axios from 'axios';
import config from '../config.js';

/**
 * Webhook Service
 * Sends webhook events to configured URL
 * Fire-and-forget, no retries in MVP
 */

/**
 * Send a webhook event
 * @param {string} event - Event type (plan.created, plan.approved, plan.executed, plan.failed)
 * @param {Object} data - Event data
 */
export async function sendWebhook(event, data) {
  if (!config.webhookUrl) {
    console.log(`[WEBHOOK] ${event} - No webhook URL configured, logging only:`, data);
    return;
  }
  
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data
  };
  
  try {
    console.log(`[WEBHOOK] Sending ${event} to ${config.webhookUrl}`);
    
    // Fire-and-forget: don't await
    axios.post(config.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event
      },
      timeout: 5000 // 5 second timeout
    }).catch(error => {
      // Log failure but don't throw
      console.error(`[WEBHOOK] Failed to send ${event}:`, error.message);
    });
    
    console.log(`[WEBHOOK] ${event} queued for delivery`);
  } catch (error) {
    // Log but don't throw - fire-and-forget
    console.error(`[WEBHOOK] Error preparing webhook ${event}:`, error.message);
  }
}
