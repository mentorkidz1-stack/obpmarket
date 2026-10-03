import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

@Injectable()
export class PriceAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Crée ou remplace l'alerte du client sur ce produit (une alerte par produit). */
  async upsert(userId: string, productId: string, targetPrice: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable.');
    if (!(targetPrice > 0)) throw new BadRequestException('Indiquez un prix supérieur à 0.');

    return this.prisma.priceAlert.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, targetPrice },
      update: { targetPrice, active: true, triggeredAt: null },
      include: { product: { select: { id: true, name: true, unitLabel: true } } },
    });
  }

  /** Alertes du client, avec le dernier prix pour comparer à son seuil. */
  async mine(userId: string) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, unitLabel: true } } },
    });
    return Promise.all(
      alerts.map(async (a) => {
        const latest = await this.prisma.referencePrice.findFirst({ where: { productId: a.productId }, orderBy: { computedAt: 'desc' } });
        return { ...a, currentPrice: latest?.value ?? null };
      }),
    );
  }

  async remove(userId: string, id: string) {
    const alert = await this.prisma.priceAlert.findUnique({ where: { id } });
    if (!alert || alert.userId !== userId) throw new NotFoundException('Alerte introuvable.');
    await this.prisma.priceAlert.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Appelé à chaque nouveau prix de référence : prévient les clients dont le seuil est atteint
   * (prix ≤ seuil), puis désactive leur alerte pour ne pas les relancer à chaque relevé.
   */
  async check(productId: string, value: number): Promise<number> {
    const due = await this.prisma.priceAlert.findMany({
      where: { productId, active: true, targetPrice: { gte: value } },
      include: { product: { select: { name: true, unitLabel: true } } },
    });

    for (const alert of due) {
      await this.prisma.priceAlert.update({ where: { id: alert.id }, data: { active: false, triggeredAt: new Date() } });
      await this.notifications.notify(alert.userId, {
        title: `Baisse de prix : ${alert.product.name}`,
        body: `Le prix est passé à ${nf.format(value)} F (${alert.product.unitLabel}), sous votre seuil de ${nf.format(alert.targetPrice)} F.`,
        href: `/produits/${alert.productId}`,
      });
    }
    return due.length;
  }
}
