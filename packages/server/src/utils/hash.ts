import crypto from 'crypto';

export function hashPayload(payload: any): string {
  const json = JSON.stringify(payload);
  return crypto.createHash('sha256').update(json).digest('hex');
}

export function generateCorrelationId(): string {
  return crypto.randomUUID();
}
