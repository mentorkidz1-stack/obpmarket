import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import { computeAvailableQuantity } from '../common/stock-availability.util.js';
import { StorageFeesService } from './storage-fees.service.js';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
    private readonly storageFees: StorageFeesService,
  ) {}

  /** « Mon stock » — STK-01 : valeur au prix actuel, plus-value latente, part réservée par une demande en cours. */
  async findMine(ownerId: string) {
    const holdings = await this.prisma.stockHolding.findMany({
      where: { ownerId, quantity: { gt: 0 } },
      include: { product: { include: { category: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      holdings.map(async (h) => {
        const [reference, { reserved }, storage] = await Promise.all([
          this.referencePrices.latestForProduct(h.productId),
          computeAvailableQuantity(this.prisma, ownerId, h.productId),
          this.storageFees.forHolding(ownerId, h.productId, h.quantity),
        ]);

        const currentValue = reference ? reference.value * h.quantity : null;
        return {
          ...h,
          currentPrice: reference?.value ?? null,
          currentValue,
          gain: currentValue != null ? currentValue - h.avgUnitCost * h.quantity : null,
          reservedQuantity: reserved,
          /** Frais de stockage : durée gratuite, frais dus à ce jour, taux. */
          storage,
        };
      }),
    );
  }
}
