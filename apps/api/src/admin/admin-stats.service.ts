import { Injectable } from '@nestjs/common';
import { OrderStatus, ReadingStatus, VendorListingStatus, VendorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK = 5;

/** Jour calendaire en heure du Bénin (UTC+1, sans changement d'heure) au format AAAA-MM-JJ. */
function beninDay(date: Date): string {
  return new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const since14 = new Date(now.getTime() - 14 * DAY_MS);
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const paid = [OrderStatus.PAYEE, OrderStatus.RETIREE];

    const [
      customers,
      activeVendors,
      products,
      publishedProperties,
      markets,
      byStatus,
      paidAll,
      paid30,
      recentPaid,
      pendingPayments,
      readingsToReview,
      vendorsToValidate,
      listingsToReview,
      liquidityPending,
      propertyInquiries,
      contactMessages,
      toWithdraw,
      pendingPayouts,
      lowStock,
      allProducts,
      topItems,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.vendorProfile.count({ where: { status: VendorStatus.ACTIF } }),
      this.prisma.product.count(),
      this.prisma.property.count({ where: { published: true, status: 'DISPONIBLE' } }),
      this.prisma.market.count(),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.aggregate({ where: { status: { in: paid } }, _sum: { totalAmount: true }, _count: { _all: true } }),
      this.prisma.order.aggregate({ where: { status: { in: paid }, paidAt: { gte: since30 } }, _sum: { totalAmount: true }, _count: { _all: true } }),
      this.prisma.order.findMany({ where: { status: { in: paid }, paidAt: { gte: since14 } }, select: { paidAt: true, totalAmount: true } }),
      this.prisma.order.count({ where: { status: { in: [OrderStatus.EN_VERIFICATION, OrderStatus.EN_ATTENTE_PAIEMENT] } } }),
      this.prisma.priceReading.count({ where: { status: ReadingStatus.A_CONTROLER } }),
      this.prisma.vendorProfile.count({ where: { status: VendorStatus.EN_ATTENTE } }),
      this.prisma.vendorListing.count({ where: { status: { in: [VendorListingStatus.EN_ATTENTE, VendorListingStatus.VALIDEE] } } }),
      this.prisma.liquidityRequest.count({ where: { status: { in: ['EN_ATTENTE'] } } }),
      this.prisma.propertyInquiry.count({ where: { status: 'NOUVEAU' } }),
      this.prisma.contactMessage.count({ where: { status: 'NOUVEAU' } }),
      this.prisma.orderItem.count({ where: { fulfillment: 'RETRAIT', withdrawalCode: { not: null }, withdrawnAt: null, order: { status: OrderStatus.PAYEE } } }),
      this.prisma.payoutRequest.count({ where: { status: 'EN_ATTENTE' } }),
      this.prisma.product.findMany({ where: { stockQuantity: { lte: LOW_STOCK } }, select: { id: true, name: true, unitLabel: true, stockQuantity: true }, orderBy: { stockQuantity: 'asc' }, take: 8 }),
      this.prisma.product.findMany({ select: { id: true, name: true } }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: { in: paid }, paidAt: { gte: since30 } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Série quotidienne sur 14 jours (jours sans vente inclus, pour un graphique continu).
    const series = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let i = 13; i >= 0; i--) {
      const day = beninDay(new Date(now.getTime() - i * DAY_MS));
      series.set(day, { date: day, orders: 0, revenue: 0 });
    }
    for (const o of recentPaid) {
      const bucket = o.paidAt ? series.get(beninDay(o.paidAt)) : undefined;
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += o.totalAmount;
      }
    }

    // Prix de référence obsolètes : produit sans prix publié, ou dont le dernier prix a plus de 48 h.
    const latest = await this.prisma.referencePrice.groupBy({ by: ['productId'], _max: { computedAt: true } });
    const lastByProduct = new Map(latest.map((l) => [l.productId, l._max.computedAt]));
    const stalePrices = allProducts
      .map((p) => {
        const at = lastByProduct.get(p.id) ?? null;
        return { id: p.id, name: p.name, lastAt: at, ageHours: at ? Math.round((now.getTime() - at.getTime()) / 3_600_000) : null };
      })
      .filter((p) => p.ageHours === null || p.ageHours > 48)
      .sort((a, b) => (b.ageHours ?? Infinity) - (a.ageHours ?? Infinity))
      .slice(0, 8);

    const names = new Map(allProducts.map((p) => [p.id, p.name]));
    const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));

    return {
      generatedAt: now.toISOString(),
      totals: { customers, activeVendors, products, publishedProperties, markets },
      sales: {
        paidOrders: paidAll._count._all,
        revenue: paidAll._sum.totalAmount ?? 0,
        paidOrders30d: paid30._count._all,
        revenue30d: paid30._sum.totalAmount ?? 0,
        averageBasket30d: paid30._count._all ? Math.round((paid30._sum.totalAmount ?? 0) / paid30._count._all) : 0,
        byStatus: statusCounts,
      },
      series: [...series.values()],
      todo: { pendingPayments, readingsToReview, vendorsToValidate, listingsToReview, liquidityPending, propertyInquiries, contactMessages, toWithdraw, pendingPayouts },
      lowStock,
      stalePrices,
      topProducts30d: topItems.map((t) => ({ productId: t.productId, name: names.get(t.productId) ?? '—', units: t._sum.quantity ?? 0 })),
    };
  }
}
