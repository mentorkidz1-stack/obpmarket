import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import { computeAvailableQuantity } from '../common/stock-availability.util.js';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
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
        const [reference, { reserved }] = await Promise.all([
          this.referencePrices.latestForProduct(h.productId),
          computeAvailableQuantity(this.prisma, ownerId, h.productId),
        ]);

        const currentValue = reference ? reference.value * h.quantity : null;
        return {
          ...h,
          currentPrice: reference?.value ?? null,
          currentValue,
          gain: currentValue != null ? currentValue - h.avgUnitCost * h.quantity : null,
          reservedQuantity: reserved,
        };
      }),
    );
  }
}
