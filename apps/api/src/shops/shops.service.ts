import { createHash } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderFillSource, VendorListingStatus, VendorStatus, type VendorProfile } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import { baseUrl, parsePhotoArray } from '../common/photos.js';
import { SlidingLimiter } from '../auth/otp-limiter.js';
import type { UpdateShopDto } from './dto/shop.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Jour calendaire au Bénin (UTC+1), à minuit UTC, pour regrouper les compteurs quotidiens. */
function beninDay(date = new Date()): Date {
  const d = new Date(date.getTime() + 60 * 60 * 1000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** « Chez Mamy Ahouandjinou » → « chez-mamy-ahouandjinou » (sans accents, sans caractères spéciaux). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** Les compteurs publics ne doivent pas se gonfler en boucle : limite par visiteur, vitrine et type d'événement. */
const eventLimiter = new SlidingLimiter(20, 60_000, 'Trop de requêtes, réessayez dans une minute.');

/** Mots qui ne peuvent pas servir de lien de boutique (routes de l'API). */
const RESERVED = new Set(['mine', 'admin', 'events']);

const FIELD = { VUE: 'views', PARTAGE: 'shares', CONTACT: 'contacts' } as const;

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
  ) {}

  private activeShopWhere = { shopPublished: true, slug: { not: null }, status: VendorStatus.ACTIF } as const;

  /** Annonces en vente d'un vendeur, avec le prix réellement payé par le client (prix de référence du jour). */
  private async liveListings(req: Request, vendorId: string) {
    const listings = await this.prisma.vendorListing.findMany({
      where: { vendorId, status: VendorListingStatus.EN_VENTE, receivedQuantity: { gt: 0 } },
      include: { product: { include: { category: true } }, depot: { select: { name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const priced = await Promise.all(
      listings.map(async (l) => {
        const reference = await this.referencePrices.latestForProduct(l.productId);
        if (!reference) return null;
        const first = parsePhotoArray(l.photos)[0];
        const photo = first
          ? first.startsWith('data:')
            ? `${baseUrl(req)}/vendor-listings/${l.id}/photo/0?v=${createHash('md5').update(first).digest('hex').slice(0, 10)}`
            : first
          : null;
        return {
          id: l.id,
          productId: l.productId,
          productName: l.product.name,
          category: l.product.category.name,
          unitLabel: l.product.unitLabel,
          available: l.receivedQuantity,
          price: reference.value,
          photo,
          depot: l.depot ? `${l.depot.name} · ${l.depot.city}` : null,
        };
      }),
    );
    return priced.filter((x): x is NonNullable<typeof x> => x !== null);
  }

  private publicShop(v: VendorProfile & { user: { createdAt: Date } }) {
    return {
      slug: v.slug!,
      name: v.shopName ?? 'Boutique',
      description: v.shopDescription,
      whatsapp: v.shopWhatsapp,
      zone: v.zone,
      type: v.type,
      memberSince: v.user.createdAt,
    };
  }

  /** Annuaire des boutiques publiées. */
  async list() {
    const vendors = await this.prisma.vendorProfile.findMany({
      where: this.activeShopWhere,
      include: { user: { select: { createdAt: true } }, _count: { select: { listings: { where: { status: VendorListingStatus.EN_VENTE, receivedQuantity: { gt: 0 } } } } } },
      orderBy: { reviewedAt: 'desc' },
      take: 100,
    });
    return vendors.map((v) => ({ ...this.publicShop(v), liveListings: v._count.listings }));
  }

  async findBySlug(req: Request, slug: string) {
    const vendor = await this.prisma.vendorProfile.findFirst({
      where: { slug, shopPublished: true, status: VendorStatus.ACTIF },
      include: { user: { select: { createdAt: true } } },
    });
    if (!vendor) throw new NotFoundException('Boutique introuvable.');
    return { ...this.publicShop(vendor), listings: await this.liveListings(req, vendor.id) };
  }

  /** Visite, partage ou contact : simple compteur, sans donnée personnelle. */
  async recordEvent(slug: string, kind: keyof typeof FIELD, visitor: string) {
    eventLimiter.hit(`${visitor}|${slug}|${kind}`);
    const vendor = await this.prisma.vendorProfile.findFirst({ where: { slug, shopPublished: true, status: VendorStatus.ACTIF }, select: { id: true } });
    if (!vendor) throw new NotFoundException('Boutique introuvable.');
    const field = FIELD[kind];
    const day = beninDay();
    await this.prisma.vendorDailyStat.upsert({
      where: { vendorId_day: { vendorId: vendor.id, day } },
      create: { vendorId: vendor.id, day, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
    return { ok: true };
  }

  // ---- Espace vendeur ----

  private async myVendor(userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException("Vous n'avez pas de compte vendeur.");
    return vendor;
  }

  /** Slug libre à partir du nom : « chez-mamy », puis « chez-mamy-2 », « chez-mamy-3 »… */
  private async freeSlug(name: string, vendorId: string): Promise<string> {
    const raw = slugify(name) || 'boutique';
    const base = RESERVED.has(raw) ? `${raw}-boutique` : raw;
    for (let i = 1; i < 50; i++) {
      const candidate = i === 1 ? base : `${base}-${i}`;
      const taken = await this.prisma.vendorProfile.findFirst({ where: { slug: candidate, id: { not: vendorId } }, select: { id: true } });
      if (!taken) return candidate;
    }
    return `${base}-${createHash('md5').update(vendorId).digest('hex').slice(0, 6)}`;
  }

  async myShop(userId: string) {
    const vendor = await this.myVendor(userId);
    return {
      slug: vendor.slug,
      shopName: vendor.shopName,
      shopDescription: vendor.shopDescription,
      shopWhatsapp: vendor.shopWhatsapp,
      shopPublished: vendor.shopPublished,
      vendorStatus: vendor.status,
      stats: await this.statsFor(vendor.id, vendor.userId),
    };
  }

  async updateMyShop(userId: string, dto: UpdateShopDto) {
    const vendor = await this.myVendor(userId);
    if (vendor.status !== VendorStatus.ACTIF) throw new ForbiddenException("Votre compte vendeur n'est pas actif : la vitrine n'est pas disponible.");

    const name = dto.shopName?.trim() ?? vendor.shopName;
    if (dto.shopPublished && !name) throw new BadRequestException('Donnez un nom à votre boutique avant de la publier.');

    let slug = vendor.slug;
    if (name && !slug) {
      try {
        slug = await this.freeSlug(name, vendor.id);
      } catch {
        throw new ConflictException('Impossible de créer le lien de la boutique, réessayez.');
      }
    }

    const updated = await this.prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        shopName: dto.shopName?.trim(),
        shopDescription: dto.shopDescription === undefined ? undefined : dto.shopDescription.trim() || null,
        shopWhatsapp: dto.shopWhatsapp === undefined ? undefined : dto.shopWhatsapp || null,
        shopPublished: dto.shopPublished,
        slug,
      },
    });
    return {
      slug: updated.slug,
      shopName: updated.shopName,
      shopDescription: updated.shopDescription,
      shopWhatsapp: updated.shopWhatsapp,
      shopPublished: updated.shopPublished,
      vendorStatus: updated.status,
      stats: await this.statsFor(updated.id, updated.userId),
    };
  }

  /** Visites, partages et contacts des 30 derniers jours, courbe sur 14 jours, et ventes de la période. */
  private async statsFor(vendorId: string, userId: string) {
    const now = new Date();
    const today = beninDay(now);
    const since30 = new Date(today.getTime() - 29 * DAY_MS);
    const since14 = new Date(today.getTime() - 13 * DAY_MS);

    const [rows, fills] = await Promise.all([
      this.prisma.vendorDailyStat.findMany({ where: { vendorId, day: { gte: since30 } }, orderBy: { day: 'asc' } }),
      this.prisma.orderFill.findMany({
        where: { source: OrderFillSource.VENDEUR, sellerId: userId, settledAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } },
        select: { quantity: true, unitPrice: true },
      }),
    ]);

    const totals = rows.reduce((t, r) => ({ views: t.views + r.views, shares: t.shares + r.shares, contacts: t.contacts + r.contacts }), { views: 0, shares: 0, contacts: 0 });
    const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r]));
    const series: Array<{ date: string; views: number }> = [];
    for (let d = since14.getTime(); d <= today.getTime(); d += DAY_MS) {
      const key = new Date(d).toISOString().slice(0, 10);
      series.push({ date: key, views: byDay.get(key)?.views ?? 0 });
    }

    return {
      last30Days: totals,
      series,
      sales30Days: { units: fills.reduce((s, f) => s + f.quantity, 0), amount: fills.reduce((s, f) => s + f.quantity * f.unitPrice, 0) },
    };
  }
}
