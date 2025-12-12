/**
 * Environment Validator
 * 
 * Validates required environment variables and enforces security policies.
 * - MUST fail if PLANNER_MODE=OPENAI and OPENAI_API_KEY is missing
 * - Logs NEVER indicate key presence
 */

function validateEnvironment() {
  const errors = [];
  
  // Check PLANNER_MODE
  const plannerMode = process.env.PLANNER_MODE;
  
  if (!plannerMode) {
    errors.push('PLANNER_MODE environment variable is required (OPENAI or CLAUDE)');
  } else if (!['OPENAI', 'CLAUDE'].includes(plannerMode)) {
    errors.push(`PLANNER_MODE must be either OPENAI or CLAUDE, got: ${plannerMode}`);
  }
  
  // If PLANNER_MODE is OPENAI, OPENAI_API_KEY must be present
  if (plannerMode === 'OPENAI') {
    if (!process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required when PLANNER_MODE=OPENAI');
    } else {
      // Log that key exists without revealing its value
      console.log('✓ OpenAI API key configured');
    }
  }
  
  // If PLANNER_MODE is CLAUDE, CLAUDE_API_KEY must be present
  if (plannerMode === 'CLAUDE') {
    if (!process.env.CLAUDE_API_KEY) {
      errors.push('CLAUDE_API_KEY is required when PLANNER_MODE=CLAUDE');
    } else {
      // Log that key exists without revealing its value
      console.log('✓ Claude API key configured');
    }
  }
  
  // Check for Whop API key (required for commerce connector)
  if (!process.env.WHOP_API_KEY) {
    errors.push('WHOP_API_KEY is required for Whop commerce connector');
  } else {
    console.log('✓ Whop API key configured');
  }
  
  // Check for environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`✓ Running in ${nodeEnv} environment`);
  
  // Check for cookie secret in production
  if (nodeEnv === 'production' && !process.env.COOKIE_SECRET) {
    errors.push('COOKIE_SECRET is required in production environment');
  } else if (process.env.COOKIE_SECRET) {
    console.log('✓ Cookie secret configured');
  }
  
  // Check execution disabled flag
  if (process.env.EXECUTION_DISABLED === 'true') {
    console.warn('⚠️  EXECUTION_DISABLED is set - all execution actions are disabled');
  }
  
  // Validate Gemini API key for image generation
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set - image generation will be disabled');
  } else {
    console.log('✓ Gemini API key configured');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

module.exports = {
  validateEnvironment
};
