import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LiquidityRequestStatus, StockMovementKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeAvailableQuantity } from '../common/stock-availability.util.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import type { CreateLiquidityRequestDto } from './dto/create-liquidity-request.dto.js';
import type { OfferLiquidityDto } from './dto/offer-liquidity.dto.js';

const OFFER_VALIDITY_HOURS = 24;
const WITH_PRODUCT = { product: { include: { category: true } } } as const;

@Injectable()
export class LiquidityService {
  constructor(private readonly prisma: PrismaService) {}

  /** LIQ-01 : le client demande à OBP de racheter une partie de son dépôt. */
  async create(clientId: string, dto: CreateLiquidityRequestDto) {
    const { available } = await computeAvailableQuantity(this.prisma, clientId, dto.productId);
    if (available < dto.quantity) {
      throw new BadRequestException(`Vous n'avez que ${available} unité(s) disponible(s) pour cette demande.`);
    }

    return this.prisma.liquidityRequest.create({
      data: { clientId, productId: dto.productId, quantity: dto.quantity },
      include: WITH_PRODUCT,
    });
  }

  /** File du back-office — LIQ-02, BO-06. */
  findPending() {
    return this.prisma.liquidityRequest.findMany({
      where: { status: { in: [LiquidityRequestStatus.EN_ATTENTE, LiquidityRequestStatus.OFFRE_ENVOYEE] } },
      include: { ...WITH_PRODUCT, client: { select: SAFE_USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** LIQ-03 : le gestionnaire fixe manuellement le prix proposé — RG-08. */
  async offer(id: string, offeredById: string, dto: OfferLiquidityDto) {
    const request = await this.prisma.liquidityRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (
      request.status !== LiquidityRequestStatus.EN_ATTENTE &&
      request.status !== LiquidityRequestStatus.OFFRE_ENVOYEE
    ) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    return this.prisma.liquidityRequest.update({
      where: { id },
      data: {
        status: LiquidityRequestStatus.OFFRE_ENVOYEE,
        offeredUnitPrice: dto.unitPrice,
        offeredById,
        offeredAt: new Date(),
        expiresAt: new Date(Date.now() + OFFER_VALIDITY_HOURS * 60 * 60 * 1000),
      },
      include: WITH_PRODUCT,
    });
  }

  findMine(clientId: string) {
    return this.prisma.liquidityRequest.findMany({
      where: { clientId },
      include: WITH_PRODUCT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** LIQ-05 : transfert de propriété à OBP, paiement immédiat sur le portefeuille. */
  async accept(clientId: string, id: string) {
    const request = await this.prisma.liquidityRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (request.clientId !== clientId) throw new ForbiddenException('Cette demande ne vous appartient pas.');
    if (request.status !== LiquidityRequestStatus.OFFRE_ENVOYEE) {
      throw new BadRequestException("Aucune offre en attente sur cette demande.");
    }
    if (request.expiresAt && request.expiresAt < new Date()) {
      throw new BadRequestException('Cette offre a expiré.');
    }

    const holding = await this.prisma.stockHolding.findUnique({
      where: { ownerId_productId: { ownerId: clientId, productId: request.productId } },
    });
    if (!holding || holding.quantity < request.quantity) {
      throw new BadRequestException('Stock en dépôt insuffisant pour finaliser ce rachat.');
    }

    const totalAmount = request.offeredUnitPrice! * request.quantity;

    await this.prisma.$transaction([
      this.prisma.stockHolding.update({
        where: { id: holding.id },
        data: { quantity: { decrement: request.quantity } },
      }),
      this.prisma.product.update({
        where: { id: request.productId },
        data: { stockQuantity: { increment: request.quantity } },
      }),
      this.prisma.stockMovement.create({
        data: {
          ownerId: clientId,
          productId: request.productId,
          kind: StockMovementKind.LIQUIDITE,
          quantity: request.quantity,
          unitValue: request.offeredUnitPrice!,
        },
      }),
      this.prisma.walletTransaction.create({
        data: { ownerId: clientId, amount: totalAmount, reason: `Rachat OBP · ${request.quantity} unité(s)` },
      }),
      this.prisma.liquidityRequest.update({
        where: { id },
        data: { status: LiquidityRequestStatus.ACCEPTEE, decidedAt: new Date() },
      }),
    ]);

    return this.prisma.liquidityRequest.findUnique({ where: { id }, include: WITH_PRODUCT });
  }

  async reject(clientId: string, id: string) {
    const request = await this.prisma.liquidityRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (request.clientId !== clientId) throw new ForbiddenException('Cette demande ne vous appartient pas.');

    return this.prisma.liquidityRequest.update({
      where: { id },
      data: { status: LiquidityRequestStatus.REFUSEE, decidedAt: new Date() },
    });
  }
}
