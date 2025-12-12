import crypto from 'crypto';

/**
 * Idempotency Service
 * Stores and checks idempotency keys to prevent duplicate execution
 * Format: planId:actionIndex:actionType:payloadHash
 */
class IdempotencyService {
  constructor() {
    // In-memory store for MVP. In production, use Redis or database
    this.store = new Map();
  }
  
  /**
   * Generate idempotency key for an action
   */
  generateKey(planId, actionIndex, actionType, payload) {
    const payloadHash = this._hashPayload(payload);
    return `${planId}:${actionIndex}:${actionType}:${payloadHash}`;
  }
  
  /**
   * Check if action has already been executed
   * Returns { executed: boolean, result?: any }
   */
  check(key) {
    if (this.store.has(key)) {
      return {
        executed: true,
        result: this.store.get(key)
      };
    }
    return { executed: false };
  }
  
  /**
   * Mark action as executed and store result
   */
  markExecuted(key, result) {
    this.store.set(key, {
      result,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Hash payload for idempotency key
   */
  _hashPayload(payload) {
    const str = JSON.stringify(payload);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
  
  /**
   * Clear all idempotency keys (for testing)
   */
  clear() {
    this.store.clear();
  }
  
  /**
   * Get store size (for testing)
   */
  size() {
    return this.store.size;
  }
}

// Singleton instance
export const idempotencyService = new IdempotencyService();
export default idempotencyService;
