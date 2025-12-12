import { prisma } from '@product-ops-agent/database';

interface AuditLogData {
  action: string;
  productId?: string;
  planId?: string;
  details: string;
  status: string;
  error?: string;
  userId?: string;
}

export class AuditService {
  async log(data: AuditLogData): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        productId: data.productId,
        planId: data.planId,
        details: data.details,
        status: data.status,
        error: data.error,
        userId: data.userId || 'system',
      },
    });
  }

  async getLogsForProduct(productId: string) {
    return prisma.auditLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLogsForPlan(planId: string) {
    return prisma.auditLog.findMany({
      where: { planId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllLogs(limit = 100) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            status: true,
          },
        },
      },
    });
  }
}

export const auditService = new AuditService();
