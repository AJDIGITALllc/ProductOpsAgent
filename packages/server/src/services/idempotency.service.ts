import { prisma } from '@product-ops-agent/database';

export class IdempotencyService {
  async check(key: string): Promise<any | null> {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!existing) {
      return null;
    }

    // Check if expired (24 hours)
    if (existing.expiresAt < new Date()) {
      // Clean up expired key
      await prisma.idempotencyKey.delete({
        where: { key },
      });
      return null;
    }

    // Return cached response if completed
    if (existing.status === 'completed' && existing.response) {
      return JSON.parse(existing.response);
    }

    // If still processing, return null to indicate in progress
    if (existing.status === 'processing') {
      throw new Error('Request is already being processed');
    }

    // If failed, return the error
    if (existing.status === 'failed') {
      throw new Error(existing.error || 'Previous request failed');
    }

    return null;
  }

  async store(
    key: string,
    action: string,
    response: any,
    success: boolean
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    await prisma.idempotencyKey.upsert({
      where: { key },
      update: {
        response: JSON.stringify(response),
        status: success ? 'completed' : 'failed',
        error: success ? null : 'Execution failed',
        updatedAt: new Date(),
      },
      create: {
        key,
        action,
        response: JSON.stringify(response),
        status: success ? 'completed' : 'failed',
        error: success ? null : 'Execution failed',
        expiresAt,
      },
    });
  }

  async markProcessing(key: string, action: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.idempotencyKey.create({
      data: {
        key,
        action,
        status: 'processing',
        expiresAt,
      },
    });
  }

  async cleanup(): Promise<number> {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}

export const idempotencyService = new IdempotencyService();
