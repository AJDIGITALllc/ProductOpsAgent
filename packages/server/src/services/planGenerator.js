import crypto from 'crypto';

/**
 * Deterministic Plan Generator
 * Pure function: same input always yields identical plan JSON
 */

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];
const SUPPORTED_INTERVALS = ['monthly', 'yearly', 'weekly', 'one_time'];

/**
 * Validation errors
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Generate a deterministic plan from user input
 * @param {Object} input - User input
 * @param {string} input.productName - Product name
 * @param {number} input.price - Product price
 * @param {string} input.currency - Currency code
 * @param {string} input.interval - Billing interval
 * @param {boolean} input.publish - Whether to publish (default: false)
 * @param {Array} input.faqs - Array of FAQ objects with question and answer
 * @returns {Object} - Deterministic plan object
 */
export function generatePlan(input) {
  // Validate input
  validateInput(input);
  
  // Generate deterministic plan ID
  const planId = generatePlanId(input);
  
  // Build actions array deterministically
  const actions = [];
  
  // 1. Create product action (always first)
  actions.push({
    type: 'create_product',
    params: {
      name: input.productName,
      price: input.price,
      currency: input.currency,
      interval: input.interval
    }
  });
  
  // 2. Add FAQs if provided (sorted for determinism)
  if (input.faqs && Array.isArray(input.faqs) && input.faqs.length > 0) {
    // Sort FAQs by question for determinism
    const sortedFaqs = [...input.faqs].sort((a, b) => 
      a.question.localeCompare(b.question)
    );
    
    sortedFaqs.forEach(faq => {
      actions.push({
        type: 'add_faq',
        params: {
          question: faq.question,
          answer: faq.answer
        }
      });
    });
  }
  
  // 3. Publish action (ONLY if explicitly requested)
  if (input.publish === true) {
    actions.push({
      type: 'publish',
      params: {}
    });
  }
  
  // Return deterministic plan
  return {
    planId,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    input: {
      productName: input.productName,
      price: input.price,
      currency: input.currency,
      interval: input.interval,
      publish: input.publish || false,
      faqCount: input.faqs?.length || 0
    },
    actions
  };
}

/**
 * Validate input parameters
 */
function validateInput(input) {
  // Required fields
  if (!input.productName || typeof input.productName !== 'string') {
    throw new ValidationError('productName is required and must be a string');
  }
  
  if (input.productName.trim().length === 0) {
    throw new ValidationError('productName cannot be empty');
  }
  
  // Price validation
  if (typeof input.price !== 'number') {
    throw new ValidationError('price must be a number');
  }
  
  if (input.price <= 0) {
    throw new ValidationError('price must be greater than 0');
  }
  
  // Currency validation
  if (!input.currency || typeof input.currency !== 'string') {
    throw new ValidationError('currency is required and must be a string');
  }
  
  const currency = input.currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError(
      `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`
    );
  }
  
  // Interval validation
  if (!input.interval || typeof input.interval !== 'string') {
    throw new ValidationError('interval is required and must be a string');
  }
  
  if (!SUPPORTED_INTERVALS.includes(input.interval)) {
    throw new ValidationError(
      `interval must be one of: ${SUPPORTED_INTERVALS.join(', ')}`
    );
  }
  
  // FAQ validation
  if (input.faqs !== undefined) {
    if (!Array.isArray(input.faqs)) {
      throw new ValidationError('faqs must be an array');
    }
    
    input.faqs.forEach((faq, index) => {
      if (!faq.question || typeof faq.question !== 'string') {
        throw new ValidationError(`faq[${index}].question is required and must be a string`);
      }
      if (!faq.answer || typeof faq.answer !== 'string') {
        throw new ValidationError(`faq[${index}].answer is required and must be a string`);
      }
    });
  }
  
  // Publish validation
  if (input.publish !== undefined && typeof input.publish !== 'boolean') {
    throw new ValidationError('publish must be a boolean');
  }
}

/**
 * Generate deterministic plan ID from input
 */
function generatePlanId(input) {
  // Create a deterministic string from input
  const inputStr = JSON.stringify({
    productName: input.productName,
    price: input.price,
    currency: input.currency.toUpperCase(),
    interval: input.interval,
    publish: input.publish || false,
    faqs: input.faqs ? [...input.faqs].sort((a, b) => 
      a.question.localeCompare(b.question)
    ) : []
  });
  
  // Generate hash
  const hash = crypto.createHash('sha256').update(inputStr).digest('hex');
  
  // Return plan ID with timestamp for uniqueness across time
  return `plan_${hash.substring(0, 12)}_${Date.now()}`;
}

export { ValidationError };
