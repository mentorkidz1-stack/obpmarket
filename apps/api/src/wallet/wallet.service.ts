import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PayoutStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { WithdrawDto } from './dto/withdraw.dto.js';

/** Montant minimum d'une demande de retrait, pour éviter les versements Mobile Money à perte. */
export const MIN_PAYOUT = 1000;

const PAYOUT_INCLUDE = {
  owner: { select: { id: true, fullName: true, phone: true } },
  processedBy: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async summary(ownerId: string) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    const pending = await this.prisma.payoutRequest.aggregate({
      where: { ownerId, status: PayoutStatus.EN_ATTENTE },
      _sum: { amount: true },
    });
    return { balance, pendingPayouts: pending._sum.amount ?? 0, transactions };
  }

  myPayouts(ownerId: string) {
    return this.prisma.payoutRequest.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  /**
   * Demande de retrait : le montant est retenu tout de suite sur le portefeuille (pas de double demande
   * possible), puis OBP verse les fonds sur le numéro Mobile Money indiqué, hors plateforme, et marque la
   * demande payée — ou la refuse, ce qui recrédite le portefeuille.
   */
  async requestPayout(ownerId: string, dto: WithdrawDto) {
    if (dto.amount < MIN_PAYOUT) throw new BadRequestException(`Le montant minimum d'un retrait est de ${MIN_PAYOUT} F.`);
    const amount = Math.round(dto.amount);

    const request = await this.prisma.$transaction(
      async (tx) => {
        const sum = await tx.walletTransaction.aggregate({ where: { ownerId }, _sum: { amount: true } });
        if (amount > (sum._sum.amount ?? 0)) throw new BadRequestException('Solde insuffisant.');
        const created = await tx.payoutRequest.create({
          data: { ownerId, amount, method: dto.method, phone: dto.phone.trim() },
        });
        await tx.walletTransaction.create({
          data: { ownerId, amount: -amount, reason: `Demande de retrait n°${created.id.slice(-6).toUpperCase()}` },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.notifications.notify(ownerId, {
      title: 'Demande de retrait reçue',
      body: `${amount} F à verser sur ${dto.phone.trim()}. OBP traite votre demande rapidement.`,
      href: '/portefeuille',
    });
    return request;
  }

  // ---- Traitement par OBP ----

  listPayouts(status?: PayoutStatus) {
    return this.prisma.payoutRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      include: PAYOUT_INCLUDE,
    });
  }

  /** Marque la demande payée une fois le versement effectué par OBP. */
  async markPaid(id: string, staffId: string, reference: string) {
    const request = await this.settle(id, { status: PayoutStatus.PAYE, reference: reference.trim(), processedById: staffId, processedAt: new Date() });
    await this.notifications.notify(request.ownerId, {
      title: 'Retrait effectué',
      body: `${request.amount} F ont été versés sur ${request.phone} (réf. ${reference.trim()}).`,
      href: '/portefeuille',
    });
    return request;
  }

  /** Refuse la demande et recrédite le portefeuille du montant retenu. */
  async reject(id: string, staffId: string, reason: string) {
    const request = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.payoutRequest.updateMany({
        where: { id, status: PayoutStatus.EN_ATTENTE },
        data: { status: PayoutStatus.REFUSE, rejectionReason: reason.trim(), processedById: staffId, processedAt: new Date() },
      });
      if (claimed.count === 0) await this.failUnavailable(id);
      const r = await tx.payoutRequest.findUniqueOrThrow({ where: { id }, include: PAYOUT_INCLUDE });
      await tx.walletTransaction.create({
        data: { ownerId: r.ownerId, amount: r.amount, reason: `Retrait refusé, montant recrédité (n°${r.id.slice(-6).toUpperCase()})` },
      });
      return r;
    });
    await this.notifications.notify(request.ownerId, {
      title: 'Retrait refusé',
      body: `${request.amount} F recrédités sur votre portefeuille. Motif : ${reason.trim()}`,
      href: '/portefeuille',
    });
    return request;
  }

  private async settle(id: string, data: Prisma.PayoutRequestUncheckedUpdateManyInput) {
    const claimed = await this.prisma.payoutRequest.updateMany({ where: { id, status: PayoutStatus.EN_ATTENTE }, data });
    if (claimed.count === 0) await this.failUnavailable(id);
    return this.prisma.payoutRequest.findUniqueOrThrow({ where: { id }, include: PAYOUT_INCLUDE });
  }

  private async failUnavailable(id: string): Promise<never> {
    const exists = await this.prisma.payoutRequest.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Demande de retrait introuvable.');
    throw new ConflictException('Cette demande a déjà été traitée.');
  }
}
