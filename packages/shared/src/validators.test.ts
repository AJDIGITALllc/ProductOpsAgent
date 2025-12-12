import {
  PricingConfigSchema,
  ActionPlanSchema,
  validateActionParams,
  ActionSchema,
  CreateProductParamsSchema,
  SetPricingParamsSchema,
} from './validators';

describe('PricingConfigSchema', () => {
  it('should validate valid pricing config', () => {
    const valid = {
      amount: 9900,
      currency: 'usd',
      interval: 'monthly',
    };
    expect(() => PricingConfigSchema.parse(valid)).not.toThrow();
  });

  it('should reject price of 0', () => {
    const invalid = {
      amount: 0,
      currency: 'usd',
      interval: 'monthly',
    };
    expect(() => PricingConfigSchema.parse(invalid)).toThrow();
  });

  it('should reject negative price', () => {
    const invalid = {
      amount: -100,
      currency: 'usd',
      interval: 'monthly',
    };
    expect(() => PricingConfigSchema.parse(invalid)).toThrow();
  });

  it('should reject invalid currency', () => {
    const invalid = {
      amount: 9900,
      currency: 'bitcoin',
      interval: 'monthly',
    };
    expect(() => PricingConfigSchema.parse(invalid)).toThrow();
  });

  it('should reject invalid interval', () => {
    const invalid = {
      amount: 9900,
      currency: 'usd',
      interval: 'daily',
    };
    expect(() => PricingConfigSchema.parse(invalid)).toThrow();
  });
});

describe('ActionPlanSchema', () => {
  it('should validate valid action plan', () => {
    const validPlan = {
      id: 'plan-123',
      actions: [
        {
          id: 'action-1',
          type: 'whop.product.create',
          params: { name: 'Test Product', status: 'draft' },
          idempotencyKey: 'idempotent-key-1',
          order: 0,
        },
      ],
      summary: 'Create a test product',
      createdAt: new Date().toISOString(),
    };
    expect(() => ActionPlanSchema.parse(validPlan)).not.toThrow();
  });

  it('should reject empty actions array', () => {
    const invalid = {
      id: 'plan-123',
      actions: [],
      summary: 'Empty plan',
      createdAt: new Date().toISOString(),
    };
    expect(() => ActionPlanSchema.parse(invalid)).toThrow();
  });

  it('should reject invalid action type', () => {
    const invalid = {
      id: 'plan-123',
      actions: [
        {
          id: 'action-1',
          type: 'invalid.action',
          params: {},
          idempotencyKey: 'key-1',
          order: 0,
        },
      ],
      summary: 'Invalid action',
      createdAt: new Date().toISOString(),
    };
    expect(() => ActionPlanSchema.parse(invalid)).toThrow();
  });
});

describe('validateActionParams', () => {
  it('should validate create product params', () => {
    const action = {
      id: 'action-1',
      type: 'whop.product.create' as const,
      params: { name: 'Product Name', status: 'draft' as const },
      idempotencyKey: 'key-1',
      order: 0,
    };
    expect(() => validateActionParams(action)).not.toThrow();
  });

  it('should reject create product with empty name', () => {
    const action = {
      id: 'action-1',
      type: 'whop.product.create' as const,
      params: { name: '', status: 'draft' as const },
      idempotencyKey: 'key-1',
      order: 0,
    };
    expect(() => validateActionParams(action)).toThrow();
  });

  it('should validate set pricing params', () => {
    const action = {
      id: 'action-2',
      type: 'whop.product.set_pricing' as const,
      params: {
        productId: 'prod-123',
        pricing: {
          amount: 4900,
          currency: 'usd',
          interval: 'one_time',
        },
      },
      idempotencyKey: 'key-2',
      order: 1,
    };
    expect(() => validateActionParams(action)).not.toThrow();
  });

  it('should reject set pricing with invalid price', () => {
    const action = {
      id: 'action-2',
      type: 'whop.product.set_pricing' as const,
      params: {
        productId: 'prod-123',
        pricing: {
          amount: 0,
          currency: 'usd',
          interval: 'one_time',
        },
      },
      idempotencyKey: 'key-2',
      order: 1,
    };
    expect(() => validateActionParams(action)).toThrow();
  });
});

describe('CreateProductParamsSchema', () => {
  it('should default status to draft', () => {
    const params = { name: 'Product Name' };
    const result = CreateProductParamsSchema.parse(params);
    expect(result.status).toBe('draft');
  });

  it('should allow explicit published status', () => {
    const params = { name: 'Product Name', status: 'published' as const };
    const result = CreateProductParamsSchema.parse(params);
    expect(result.status).toBe('published');
  });
});
