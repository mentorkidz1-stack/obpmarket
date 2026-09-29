import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReadingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import { PRICING_CONFIG } from '../config/pricing-config.token.js';
import type { PricingConfig } from '../config/pricing.config.js';
import { distanceMeters } from '../common/geo.util.js';
import type { CreatePriceReadingDto } from './dto/create-price-reading.dto.js';
import type { ReviewPriceReadingDto } from './dto/review-price-reading.dto.js';

@Injectable()
export class PriceReadingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
    @Inject(PRICING_CONFIG) private readonly config: PricingConfig,
  ) {}

  /**
   * Enregistre un relevé (COL-03) et le compare à la fois à la zone du marché
   * (COL-05) et au dernier prix de référence publié (PRI-02). Un relevé hors
   * zone ou trop éloigné du prix connu est mis de côté pour contrôle plutôt
   * que rejeté d'office : c'est le gestionnaire qui tranche (BO-04).
   */
  async create(dto: CreatePriceReadingDto) {
    const market = await this.prisma.market.findUnique({ where: { id: dto.marketId } });
    if (!market) throw new NotFoundException(`Marché ${dto.marketId} introuvable`);

    let distanceToMarketMeters: number | undefined;
    let flagReason: string | undefined;

    if (dto.latitude != null && dto.longitude != null) {
      distanceToMarketMeters = distanceMeters(dto.latitude, dto.longitude, market.latitude, market.longitude);
      if (distanceToMarketMeters > market.radiusMeters) {
        flagReason = `Hors zone : à ${Math.round(distanceToMarketMeters)} m du marché (rayon ${market.radiusMeters} m)`;
      }
    }

    if (!flagReason) {
      const reference = await this.referencePrices.latestForProduct(dto.productId);
      if (reference) {
        const deviation = Math.abs(dto.price - Number(reference.value)) / Number(reference.value);
        if (deviation > this.config.anomalyThreshold) {
          flagReason = `Écart de ${(deviation * 100).toFixed(1)} % avec le prix moyen (${Math.round(Number(reference.value))} F)`;
        }
      }
    }

    const reading = await this.prisma.priceReading.create({
      data: {
        productId: dto.productId,
        marketId: dto.marketId,
        agentId: dto.agentId,
        price: dto.price,
        quality: dto.quality,
        photoUrl: dto.photoUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distanceToMarketMeters,
        status: flagReason ? ReadingStatus.A_CONTROLER : ReadingStatus.VALIDE,
        flagReason,
      },
    });

    const recompute = await this.referencePrices.recomputeForProduct(dto.productId);
    return { reading, recompute };
  }

  findToReview() {
    return this.prisma.priceReading.findMany({
      where: { status: ReadingStatus.A_CONTROLER },
      include: { product: true, market: true, agent: { select: SAFE_USER_SELECT } },
      orderBy: { recordedAt: 'asc' },
    });
  }

  findForProduct(productId: string) {
    return this.prisma.priceReading.findMany({
      where: { productId },
      include: { market: true, agent: { select: SAFE_USER_SELECT } },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /** Le gestionnaire valide quand même un relevé signalé (BO-04). */
  async approve(id: string, reviewedById: string, dto: ReviewPriceReadingDto) {
    const reading = await this.setStatus(id, ReadingStatus.VALIDE, reviewedById, dto);
    const recompute = await this.referencePrices.recomputeForProduct(reading.productId);
    return { reading, recompute };
  }

  /** Le gestionnaire rejette définitivement un relevé (BO-04). */
  reject(id: string, reviewedById: string, dto: ReviewPriceReadingDto) {
    return this.setStatus(id, ReadingStatus.REJETE, reviewedById, dto);
  }

  private async setStatus(id: string, status: ReadingStatus, reviewedById: string, dto: ReviewPriceReadingDto) {
    const existing = await this.prisma.priceReading.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Relevé ${id} introuvable`);

    return this.prisma.priceReading.update({
      where: { id },
      data: {
        status,
        reviewNote: dto.note,
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }
}
