import { prisma } from '@product-ops-agent/database';

export interface AuditLogData {
  planId?: string;
  userId?: string;
  action: string;
  details: any;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        planId: data.planId,
        userId: data.userId,
        action: data.action,
        details: JSON.stringify(data.details),
        ipAddress: data.ipAddress,
        correlationId: data.correlationId,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs for a plan
 */
export async function getAuditLogs(planId: string) {
  return prisma.auditLog.findMany({
    where: { planId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit: number = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
