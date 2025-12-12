/**
 * ProductOpsAgent - Main Entry Point
 * 
 * A chat UI where the user says: "Create a new product called X, price it at Y, 
 * make it recurring, add FAQs," and an agent executes those actions through 
 * the Whop API with guardrails, logging, and rollback.
 */

const { validateEnvironment } = require('./config/env-validator');
const { startServer } = require('./api/server');
const { cleanup: cleanupTelemetry } = require('./services/telemetry-service');

let server = null;

async function main() {
  console.log('🚀 Starting ProductOpsAgent...');
  
  // Validate environment variables before starting
  try {
    validateEnvironment();
    console.log('✓ Environment validation passed');
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
  
  // Start the API server
  try {
    server = await startServer();
    console.log('✓ ProductOpsAgent started successfully');
  } catch (error) {
    console.error('❌ Failed to start ProductOpsAgent:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  
  // Clean up telemetry service
  cleanupTelemetry();
  
  // Close server
  if (server) {
    server.close(() => {
      console.log('✓ Server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the application
main();
