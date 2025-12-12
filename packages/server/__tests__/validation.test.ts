import { validateActionPlan, isWhitelistedAction } from '../src/utils/validation';

describe('Validation', () => {
  test('validates a valid action plan', () => {
    const plan = {
      planId: 'plan-123',
      actions: [
        {
          type: 'CREATE_PRODUCT',
          payload: {
            name: 'Test Product',
            price: 99.99,
            recurring: true,
          },
        },
      ],
      description: 'Test plan',
    };
    
    const result = validateActionPlan(plan);
    expect(result.valid).toBe(true);
    expect(result.plan).toEqual(plan);
  });
  
  test('rejects plan with invalid action type', () => {
    const plan = {
      planId: 'plan-123',
      actions: [
        {
          type: 'INVALID_ACTION',
          payload: {},
        },
      ],
    };
    
    const result = validateActionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('rejects plan with no actions', () => {
    const plan = {
      planId: 'plan-123',
      actions: [],
    };
    
    const result = validateActionPlan(plan);
    expect(result.valid).toBe(false);
  });
  
  test('checks whitelisted actions', () => {
    expect(isWhitelistedAction('CREATE_PRODUCT')).toBe(true);
    expect(isWhitelistedAction('UPDATE_PRODUCT')).toBe(true);
    expect(isWhitelistedAction('DELETE_PRODUCT')).toBe(true);
    expect(isWhitelistedAction('ADD_FAQ')).toBe(true);
    expect(isWhitelistedAction('UPDATE_FAQ')).toBe(true);
    expect(isWhitelistedAction('DELETE_FAQ')).toBe(true);
    expect(isWhitelistedAction('INVALID_ACTION')).toBe(false);
  });
});
