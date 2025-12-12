import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables on boot
function validateEnv() {
  const required = ['JWT_SECRET', 'PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn if optional variables are missing
  if (!process.env.WHOP_API_KEY) {
    console.warn('⚠️  WHOP_API_KEY not set - running in STUB MODE');
  }
  
  if (!process.env.WEBHOOK_URL) {
    console.warn('⚠️  WEBHOOK_URL not set - webhooks will be logged but not sent');
  }
}

// Config object
export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET,
  whopApiKey: process.env.WHOP_API_KEY || null,
  webhookUrl: process.env.WEBHOOK_URL || null,
  nodeEnv: process.env.NODE_ENV || 'development',
  webhookTimeout: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000'),
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100') // limit each IP to 100 requests per windowMs
  },
  
  // Stub mode check
  isStubMode() {
    return !this.whopApiKey;
  }
};

// Validate on module load
validateEnv();

export default config;
