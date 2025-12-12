/**
 * Integration tests for WhopClient
 * These tests only run when WHOP_API_KEY is set in environment
 */

import { WhopClient } from '../WhopClient';

describe('WhopClient Integration Tests', () => {
  const hasApiKey = !!process.env.WHOP_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.log('⏭️  Skipping Whop integration tests - WHOP_API_KEY not set');
    }
  });

  describe('Stub Mode', () => {
    it('should operate in stub mode without API key', () => {
      const originalKey = process.env.WHOP_API_KEY;
      delete process.env.WHOP_API_KEY;
      
      const client = WhopClient.getInstance();
      expect(client.isStubMode()).toBe(true);
      
      process.env.WHOP_API_KEY = originalKey;
    });
  });

  describe('Real API Mode', () => {
    if (!hasApiKey) {
      it.skip('Real API tests require WHOP_API_KEY', () => {});
      return;
    }

    let client: WhopClient;
    let testProductId: string;

    beforeAll(() => {
      client = WhopClient.getInstance();
    });

    it('should create a product', async () => {
      const product = await client.createProduct({
        name: `Test Product ${Date.now()}`,
        description: 'Integration test product',
      });

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.name).toContain('Test Product');
      
      testProductId = product.id;
    }, 10000);

    it('should update a product', async () => {
      if (!testProductId) {
        throw new Error('No test product ID available');
      }

      const updated = await client.updateProduct(testProductId, {
        description: 'Updated description',
      });

      expect(updated).toBeDefined();
      expect(updated.description).toBe('Updated description');
    }, 10000);

    it('should set pricing on a product', async () => {
      if (!testProductId) {
        throw new Error('No test product ID available');
      }

      const result = await client.setPricing(testProductId, {
        type: 'one_time',
        amount: 4900,
        currency: 'usd',
      });

      expect(result).toBeDefined();
    }, 10000);

    it('should add metadata to a product', async () => {
      if (!testProductId) {
        throw new Error('No test product ID available');
      }

      const result = await client.addMetadata(testProductId, {
        faqs: [
          {
            question: 'Test question?',
            answer: 'Test answer',
          },
        ],
      });

      expect(result).toBeDefined();
    }, 10000);

    it('should get a product', async () => {
      if (!testProductId) {
        throw new Error('No test product ID available');
      }

      const product = await client.getProduct(testProductId);

      expect(product).toBeDefined();
      expect(product.id).toBe(testProductId);
    }, 10000);

    // Note: We don't test publishProduct in integration tests
    // to avoid creating live published products
  });
});
