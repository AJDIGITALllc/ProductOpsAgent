/**
 * Integration test for idempotency
 * This test verifies that duplicate action executions return cached results
 */

import { generateIdempotencyKey, checkIdempotency, storeIdempotencyKeyProcessing, updateIdempotencyKeyResult } from '../src/services/idempotency';
import { ActionType, ActionPayload } from '../src/types';
import { prisma } from '@product-ops-agent/database';

describe('Integration: Idempotency', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.idempotencyKey.deleteMany({
      where: {
        key: {
          startsWith: 'test_plan_',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('duplicate action execution returns cached result', async () => {
    const planId = 'test_plan_idempotency';
    const actionIndex = 0;
    const actionType: ActionType = 'CREATE_PRODUCT';
    const payload: ActionPayload = {
      name: 'Idempotency Test Product',
      price: 49.99,
      recurring: false,
    };

    const key = generateIdempotencyKey(planId, actionIndex, actionType, payload);

    // First execution - no cache
    let check = await checkIdempotency(key);
    expect(check.exists).toBe(false);

    // Store as processing
    await storeIdempotencyKeyProcessing(key, planId, actionIndex);

    // Check again - should exist but be processing
    check = await checkIdempotency(key);
    expect(check.exists).toBe(true);
    expect(check.status).toBe('PROCESSING');

    // Complete with result
    const result = { id: 'prod_test_123', name: 'Idempotency Test Product', price: 49.99 };
    await updateIdempotencyKeyResult(key, 'COMPLETED', result);

    // Second execution - should return cached result
    check = await checkIdempotency(key);
    expect(check.exists).toBe(true);
    expect(check.status).toBe('COMPLETED');
    expect(check.result).toEqual(result);

    // Verify the same payload generates the same key
    const key2 = generateIdempotencyKey(planId, actionIndex, actionType, payload);
    expect(key2).toBe(key);

    // Verify different payload generates different key
    const payload2 = { ...payload, price: 99.99 };
    const key3 = generateIdempotencyKey(planId, actionIndex, actionType, payload2);
    expect(key3).not.toBe(key);
  });
});
