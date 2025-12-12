import { WhopClient } from './client';

describe('WhopClient idempotency', () => {
  let client: WhopClient;

  beforeEach(() => {
    // Create client in stub mode (no API key)
    client = new WhopClient();
  });

  it('should return cached result for duplicate createProduct calls', async () => {
    const idempotencyKey = 'test-key-create-1';
    const params = { name: 'Test Product', status: 'draft' as const };

    const result1 = await client.createProduct(params, idempotencyKey);
    const result2 = await client.createProduct(params, idempotencyKey);

    // Should return the exact same object
    expect(result1).toBe(result2);
    expect(result1.id).toBe(result2.id);
  });

  it('should return different results for different idempotency keys', async () => {
    const params = { name: 'Test Product', status: 'draft' as const };

    const result1 = await client.createProduct(params, 'key-1');
    const result2 = await client.createProduct(params, 'key-2');

    // Should return different objects
    expect(result1).not.toBe(result2);
    expect(result1.id).not.toBe(result2.id);
  });

  it('should cache updateProductName results', async () => {
    const idempotencyKey = 'test-key-update-1';

    const result1 = await client.updateProductName('prod-123', 'New Name', idempotencyKey);
    const result2 = await client.updateProductName('prod-123', 'New Name', idempotencyKey);

    expect(result1).toBe(result2);
  });

  it('should cache setProductPricing results', async () => {
    const idempotencyKey = 'test-key-pricing-1';
    const pricing = {
      amount: 9900,
      currency: 'usd' as const,
      interval: 'monthly' as const,
    };

    const result1 = await client.setProductPricing('prod-123', pricing, idempotencyKey);
    const result2 = await client.setProductPricing('prod-123', pricing, idempotencyKey);

    expect(result1).toBe(result2);
  });

  it('should cache publishProduct results', async () => {
    const idempotencyKey = 'test-key-publish-1';

    const result1 = await client.publishProduct('prod-123', idempotencyKey);
    const result2 = await client.publishProduct('prod-123', idempotencyKey);

    expect(result1).toBe(result2);
  });
});

describe('WhopClient stub mode', () => {
  it('should run in stub mode without API key', () => {
    const client = new WhopClient();
    // Should not throw
    expect(client).toBeDefined();
  });

  it('should create stub product', async () => {
    const client = new WhopClient();
    const result = await client.createProduct(
      { name: 'Stub Product', status: 'draft' },
      'stub-key-1'
    );

    expect(result.id).toContain('stub_product_');
    expect(result.name).toBe('Stub Product');
    expect(result.status).toBe('draft');
  });

  it('should get stub product', async () => {
    const client = new WhopClient();
    const result = await client.getProduct('any-id');

    expect(result.id).toBe('any-id');
    expect(result.name).toBe('Stub Product');
    expect(result.status).toBe('draft');
  });
});
