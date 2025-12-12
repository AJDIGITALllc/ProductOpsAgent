/**
 * ProductOpsAgent - Main Entry Point
 * 
 * A chat UI where the user says: "Create a new product called X, price it at Y, 
 * make it recurring, add FAQs," and an agent executes those actions through 
 * the Whop API with guardrails, logging, and rollback.
 */

const { validateEnvironment } = require('./config/env-validator');
const { startServer } = require('./api/server');

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
    await startServer();
    console.log('✓ ProductOpsAgent started successfully');
  } catch (error) {
    console.error('❌ Failed to start ProductOpsAgent:', error.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();
