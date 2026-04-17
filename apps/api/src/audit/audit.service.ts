import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    diff?: unknown;
    ipAddress: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        diff: params.diff as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
      },
    });
  }
}
