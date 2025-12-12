/**
 * Webhook Router
 * 
 * Handles incoming webhooks from Whop
 */

const express = require('express');
const crypto = require('crypto');

function createWebhookRouter() {
  const router = express.Router();
  
  // Verify webhook signature
  function verifyWebhookSignature(req, res, next) {
    const signature = req.headers['x-whop-signature'];
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    
    if (!secret) {
      console.warn('⚠️  WHOP_WEBHOOK_SECRET not configured - webhook signature verification disabled');
      return next();
    }
    
    if (!signature) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }
    
    try {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      
      next();
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error.message);
      res.status(500).json({ error: 'Signature verification failed' });
    }
  }
  
  // Whop webhook endpoint
  router.post('/whop', verifyWebhookSignature, async (req, res) => {
    try {
      const { event, data } = req.body;
      
      console.log(`📥 Webhook received: ${event}`);
      
      // Handle different webhook events
      switch (event) {
        case 'product.created':
          console.log('✓ Product created:', data.id);
          break;
        case 'product.updated':
          console.log('✓ Product updated:', data.id);
          break;
        case 'product.deleted':
          console.log('✓ Product deleted:', data.id);
          break;
        default:
          console.log(`⚠️  Unknown webhook event: ${event}`);
      }
      
      // Respond immediately to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
  
  return router;
}

module.exports = {
  createWebhookRouter
};
