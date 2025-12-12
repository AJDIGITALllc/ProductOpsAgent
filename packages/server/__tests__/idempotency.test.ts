import { generateIdempotencyKey } from '../src/services/idempotency';
import { ActionType, ActionPayload } from '../src/types';

describe('Idempotency', () => {
  test('generates consistent idempotency keys for same input', () => {
    const planId = 'test-plan-1';
    const actionIndex = 0;
    const actionType: ActionType = 'CREATE_PRODUCT';
    const payload: ActionPayload = {
      name: 'Test Product',
      price: 99.99,
      recurring: true,
    };
    
    const key1 = generateIdempotencyKey(planId, actionIndex, actionType, payload);
    const key2 = generateIdempotencyKey(planId, actionIndex, actionType, payload);
    
    expect(key1).toBe(key2);
    expect(key1).toMatch(/^test-plan-1:0:CREATE_PRODUCT:[a-f0-9]{64}$/);
  });
  
  test('generates different keys for different payloads', () => {
    const planId = 'test-plan-1';
    const actionIndex = 0;
    const actionType: ActionType = 'CREATE_PRODUCT';
    
    const payload1: ActionPayload = { name: 'Product A', price: 10 };
    const payload2: ActionPayload = { name: 'Product B', price: 20 };
    
    const key1 = generateIdempotencyKey(planId, actionIndex, actionType, payload1);
    const key2 = generateIdempotencyKey(planId, actionIndex, actionType, payload2);
    
    expect(key1).not.toBe(key2);
  });
  
  test('generates different keys for different action indices', () => {
    const planId = 'test-plan-1';
    const actionType: ActionType = 'CREATE_PRODUCT';
    const payload: ActionPayload = { name: 'Product', price: 10 };
    
    const key1 = generateIdempotencyKey(planId, 0, actionType, payload);
    const key2 = generateIdempotencyKey(planId, 1, actionType, payload);
    
    expect(key1).not.toBe(key2);
  });
});
