import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Qui agit : la requête authentifiée (ou rien, pour une action automatique comme le webhook de paiement). */
export interface AuditActor {
  userId?: string | null;
  userName?: string | null;
}

/**
 * Journal d'activité du back-office. Une erreur d'écriture du journal ne doit jamais bloquer l'action elle-même.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(actor: AuditActor | null, action: string, target: string, detail?: string): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: actor?.userId ?? null,
          actorName: actor?.userName ?? 'Système',
          action,
          target,
          detail: detail ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Journal d'activité : écriture impossible (${err instanceof Error ? err.message : err})`);
    }
  }

  list(params: { take?: number; skip?: number; actorId?: string; action?: string }) {
    return this.prisma.auditLog.findMany({
      where: { actorId: params.actorId || undefined, action: params.action ? { contains: params.action, mode: 'insensitive' } : undefined },
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.take ?? 100, 300),
      skip: params.skip ?? 0,
    });
  }
}
