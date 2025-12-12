import { prisma } from '@product-ops-agent/database';
import { hashPayload } from '../utils/hash';
import { ActionType, ActionPayload } from '../types';

/**
 * Generate idempotency key in format: planId:actionIndex:actionType:payloadHash
 */
export function generateIdempotencyKey(
  planId: string,
  actionIndex: number,
  actionType: ActionType,
  payload: ActionPayload
): string {
  const payloadHash = hashPayload(payload);
  return `${planId}:${actionIndex}:${actionType}:${payloadHash}`;
}

/**
 * Check if an action has already been executed (idempotency check)
 */
export async function checkIdempotency(key: string): Promise<{
  exists: boolean;
  status?: string;
  result?: any;
}> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  });
  
  if (!existing) {
    return { exists: false };
  }
  
  return {
    exists: true,
    status: existing.status,
    result: existing.resultJson ? JSON.parse(existing.resultJson) : null,
  };
}

/**
 * Store idempotency key with status=PROCESSING
 */
export async function storeIdempotencyKeyProcessing(
  key: string,
  planId: string,
  actionIndex: number
): Promise<void> {
  await prisma.idempotencyKey.create({
    data: {
      key,
      planId,
      actionIndex,
      status: 'PROCESSING',
    },
  });
}

/**
 * Update idempotency key with result
 */
export async function updateIdempotencyKeyResult(
  key: string,
  status: 'COMPLETED' | 'FAILED',
  result: any
): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { key },
    data: {
      status,
      resultJson: JSON.stringify(result),
    },
  });
}
