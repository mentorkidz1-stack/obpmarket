import { Inject, Injectable } from '@nestjs/common';
import { ReadingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PRICING_CONFIG } from '../config/pricing-config.token.js';
import type { PricingConfig } from '../config/pricing.config.js';

export interface RecomputeResult {
  published: boolean;
  reason?: 'insufficient-readings' | 'insufficient-markets';
  readingsCount: number;
  marketsCount: number;
  value?: number;
}

@Injectable()
export class ReferencePricesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRICING_CONFIG) private readonly config: PricingConfig,
  ) {}

  /**
   * Recalcule le prix de référence d'un produit à partir des relevés valides
   * de la fenêtre glissante — RG-01. Ne publie que si les seuils minimaux
   * sont atteints — RG-03. Toujours appelé après la création ou la
   * validation d'un relevé (COL-03, BO-04).
   */
  async recomputeForProduct(productId: string): Promise<RecomputeResult> {
    const since = new Date(Date.now() - this.config.windowHours * 60 * 60 * 1000);

    const readings = await this.prisma.priceReading.findMany({
      where: { productId, status: ReadingStatus.VALIDE, recordedAt: { gte: since } },
      select: { price: true, marketId: true },
    });

    const marketsCount = new Set(readings.map((r) => r.marketId)).size;

    if (readings.length < this.config.minReadings) {
      return { published: false, reason: 'insufficient-readings', readingsCount: readings.length, marketsCount };
    }
    if (marketsCount < this.config.minMarkets) {
      return { published: false, reason: 'insufficient-markets', readingsCount: readings.length, marketsCount };
    }

    const sum = readings.reduce((acc, r) => acc + Number(r.price), 0);
    const value = sum / readings.length;

    await this.prisma.referencePrice.create({
      data: {
        productId,
        value,
        readingsCount: readings.length,
        marketsCount,
        windowHours: this.config.windowHours,
      },
    });

    return { published: true, readingsCount: readings.length, marketsCount, value };
  }

  latestForProduct(productId: string) {
    return this.prisma.referencePrice.findFirst({
      where: { productId },
      orderBy: { computedAt: 'desc' },
    });
  }

  /** Historique pour la courbe d'évolution de la fiche produit (PRI-05). */
  historyForProduct(productId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.referencePrice.findMany({
      where: { productId, computedAt: { gte: since } },
      orderBy: { computedAt: 'asc' },
    });
  }

  async latestForAllProducts() {
    // Un prix par produit : le plus récent, avec la variation sur 7 jours (CAT-05, PRI-05).
    // Une requête par produit reste simple et lisible pour le volume attendu en V1 ; à revoir
    // (ex. DISTINCT ON en PostgreSQL) si le catalogue grossit beaucoup.
    const products = await this.prisma.product.findMany({ select: { id: true } });
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const prices = await Promise.all(
      products.map(async (p) => {
        const [latest, aWeekAgo] = await Promise.all([
          this.prisma.referencePrice.findFirst({ where: { productId: p.id }, orderBy: { computedAt: 'desc' } }),
          this.prisma.referencePrice.findFirst({
            where: { productId: p.id, computedAt: { lte: weekAgo } },
            orderBy: { computedAt: 'desc' },
          }),
        ]);
        if (!latest) return null;
        const changePct7d = aWeekAgo ? ((latest.value - aWeekAgo.value) / aWeekAgo.value) * 100 : null;
        return { ...latest, changePct7d };
      }),
    );
    return prices.filter((p): p is NonNullable<typeof p> => p !== null);
  }
}
