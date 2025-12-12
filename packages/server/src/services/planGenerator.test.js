import { test } from 'node:test';
import assert from 'node:assert';
import { generatePlan, ValidationError } from './planGenerator.js';

test('generatePlan - determinism: same input yields identical actions', () => {
  const input = {
    productName: 'Test Product',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    publish: false
  };
  
  const plan1 = generatePlan(input);
  const plan2 = generatePlan(input);
  
  // Actions should be identical
  assert.deepStrictEqual(plan1.actions, plan2.actions);
  assert.strictEqual(plan1.actions.length, 1); // Only create_product
  assert.strictEqual(plan1.actions[0].type, 'create_product');
});

test('generatePlan - publish only when explicitly requested', () => {
  const inputWithoutPublish = {
    productName: 'Test Product',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly'
  };
  
  const planWithoutPublish = generatePlan(inputWithoutPublish);
  const hasPublish = planWithoutPublish.actions.some(a => a.type === 'publish');
  assert.strictEqual(hasPublish, false);
  
  const inputWithPublish = {
    ...inputWithoutPublish,
    publish: true
  };
  
  const planWithPublish = generatePlan(inputWithPublish);
  const hasPublishAction = planWithPublish.actions.some(a => a.type === 'publish');
  assert.strictEqual(hasPublishAction, true);
  assert.strictEqual(planWithPublish.actions[planWithPublish.actions.length - 1].type, 'publish');
});

test('generatePlan - FAQs sorted deterministically', () => {
  const input = {
    productName: 'Test Product',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    faqs: [
      { question: 'Z question', answer: 'Z answer' },
      { question: 'A question', answer: 'A answer' },
      { question: 'M question', answer: 'M answer' }
    ]
  };
  
  const plan1 = generatePlan(input);
  const plan2 = generatePlan(input);
  
  // Actions should be identical
  assert.deepStrictEqual(plan1.actions, plan2.actions);
  
  // FAQs should be sorted
  const faqActions = plan1.actions.filter(a => a.type === 'add_faq');
  assert.strictEqual(faqActions.length, 3);
  assert.strictEqual(faqActions[0].params.question, 'A question');
  assert.strictEqual(faqActions[1].params.question, 'M question');
  assert.strictEqual(faqActions[2].params.question, 'Z question');
});

test('generatePlan - validation: price must be > 0', () => {
  const input = {
    productName: 'Test Product',
    price: 0,
    currency: 'USD',
    interval: 'monthly'
  };
  
  assert.throws(
    () => generatePlan(input),
    ValidationError
  );
  
  try {
    generatePlan(input);
  } catch (err) {
    assert.strictEqual(err.message, 'price must be greater than 0');
  }
});

test('generatePlan - validation: negative price rejected', () => {
  const input = {
    productName: 'Test Product',
    price: -10,
    currency: 'USD',
    interval: 'monthly'
  };
  
  assert.throws(
    () => generatePlan(input),
    ValidationError
  );
});

test('generatePlan - validation: supported currency', () => {
  const validInput = {
    productName: 'Test Product',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly'
  };
  
  assert.doesNotThrow(() => generatePlan(validInput));
  
  const invalidInput = {
    ...validInput,
    currency: 'JPY' // Not in supported list
  };
  
  assert.throws(
    () => generatePlan(invalidInput),
    ValidationError
  );
  
  try {
    generatePlan(invalidInput);
  } catch (err) {
    assert.ok(err.message.includes('currency must be one of'));
  }
});

test('generatePlan - validation: supported interval', () => {
  const validInput = {
    productName: 'Test Product',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly'
  };
  
  assert.doesNotThrow(() => generatePlan(validInput));
  
  const invalidInput = {
    ...validInput,
    interval: 'biweekly' // Not in supported list
  };
  
  assert.throws(
    () => generatePlan(invalidInput),
    ValidationError
  );
  
  try {
    generatePlan(invalidInput);
  } catch (err) {
    assert.ok(err.message.includes('interval must be one of'));
  }
});

test('generatePlan - validation: productName required', () => {
  const input = {
    productName: '',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly'
  };
  
  assert.throws(
    () => generatePlan(input),
    ValidationError
  );
});

test('generatePlan - complete plan structure', () => {
  const input = {
    productName: 'Test Product',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    publish: true,
    faqs: [
      { question: 'Q1', answer: 'A1' }
    ]
  };
  
  const plan = generatePlan(input);
  
  assert.ok(plan.planId);
  assert.ok(plan.createdAt);
  assert.strictEqual(plan.status, 'PENDING');
  assert.ok(Array.isArray(plan.actions));
  assert.strictEqual(plan.actions.length, 3); // create + faq + publish
  assert.strictEqual(plan.actions[0].type, 'create_product');
  assert.strictEqual(plan.actions[1].type, 'add_faq');
  assert.strictEqual(plan.actions[2].type, 'publish');
});
