import { test } from 'node:test';
import assert from 'node:assert';
import idempotencyService from './idempotency.js';

test('idempotency - generateKey creates consistent keys', () => {
  const key1 = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test' });
  const key2 = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test' });
  
  assert.strictEqual(key1, key2);
});

test('idempotency - different payloads create different keys', () => {
  const key1 = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test1' });
  const key2 = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test2' });
  
  assert.notStrictEqual(key1, key2);
});

test('idempotency - check returns false for new key', () => {
  idempotencyService.clear();
  
  const key = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test' });
  const result = idempotencyService.check(key);
  
  assert.strictEqual(result.executed, false);
  assert.strictEqual(result.result, undefined);
});

test('idempotency - markExecuted and check', () => {
  idempotencyService.clear();
  
  const key = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test' });
  const actionResult = { productId: '123', status: 'created' };
  
  idempotencyService.markExecuted(key, actionResult);
  
  const checkResult = idempotencyService.check(key);
  
  assert.strictEqual(checkResult.executed, true);
  assert.deepStrictEqual(checkResult.result.result, actionResult);
  assert.ok(checkResult.result.timestamp);
});

test('idempotency - prevents duplicate execution', () => {
  idempotencyService.clear();
  
  const key = idempotencyService.generateKey('plan1', 0, 'create_product', { name: 'Test' });
  
  // First execution
  const firstCheck = idempotencyService.check(key);
  assert.strictEqual(firstCheck.executed, false);
  
  const result = { productId: '123' };
  idempotencyService.markExecuted(key, result);
  
  // Second execution attempt
  const secondCheck = idempotencyService.check(key);
  assert.strictEqual(secondCheck.executed, true);
  assert.deepStrictEqual(secondCheck.result.result, result);
});

test('idempotency - key format', () => {
  const key = idempotencyService.generateKey('plan_abc', 2, 'add_faq', { q: 'test', a: 'answer' });
  
  // Key should have format: planId:actionIndex:actionType:payloadHash
  const parts = key.split(':');
  assert.strictEqual(parts.length, 4);
  assert.strictEqual(parts[0], 'plan_abc');
  assert.strictEqual(parts[1], '2');
  assert.strictEqual(parts[2], 'add_faq');
  assert.strictEqual(parts[3].length, 16); // Hash length
});

test('idempotency - clear removes all keys', () => {
  idempotencyService.clear();
  
  idempotencyService.markExecuted('key1', { result: 1 });
  idempotencyService.markExecuted('key2', { result: 2 });
  
  assert.strictEqual(idempotencyService.size(), 2);
  
  idempotencyService.clear();
  
  assert.strictEqual(idempotencyService.size(), 0);
});
