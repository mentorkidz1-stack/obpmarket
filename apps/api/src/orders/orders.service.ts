import { randomInt } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FulfillmentMode,
  OrderFillSource,
  OrderStatus,
  ResaleListingStatus,
  StockMovementKind,
  VendorListingStatus,
  type PaymentMethod,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NyoleService, type NyoleWebhookEvent } from '../nyole/nyole.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { SubmitPaymentReferenceDto } from './dto/submit-payment-reference.dto.js';

function generateWithdrawalCode(): string {
  return String(randomInt(100000, 1000000));
}

/** Code à 6 chiffres encore inutilisé : deux bons de retrait en attente ne partagent jamais le même code. */
async function uniqueWithdrawalCode(tx: { orderItem: { findFirst: (args: { where: { withdrawalCode: string; withdrawnAt: null } }) => Promise<unknown> } }): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateWithdrawalCode();
    if (!(await tx.orderItem.findFirst({ where: { withdrawalCode: code, withdrawnAt: null } }))) return code;
  }
  throw new Error('Impossible de générer un bon de retrait unique.');
}

const WITH_PRODUCT = { items: { include: { product: { include: { category: true } } } } } as const;

/// REV-07 : commission d'OBP sur les reventes entre clients, à confirmer avec la
/// direction (cahier des charges §11, point 15) — 5 % par défaut en attendant.
const RESALE_COMMISSION_RATE = Number(process.env.RESALE_COMMISSION_RATE ?? 0.05);
/// VEN-12 : commission d'OBP sur les ventes des vendeurs partenaires, également à confirmer.
const VENDOR_COMMISSION_RATE = Number(process.env.VENDOR_COMMISSION_RATE ?? 0.08);
const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'http://localhost:3000';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
    private readonly nyole: NyoleService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Verrouille le prix courant (CMD-03) et réserve le stock (CMD-07) dans une
   * transaction : soit toute la commande passe, soit rien n'est décrémenté.
   *
   * Le stock est réservé tout de suite (revente, vendeurs, puis stock OBP), mais le
   * vendeur n'est crédité qu'à la confirmation du paiement (OrdersService.confirmPayment) :
   * chaque ligne consommée est tracée dans un OrderFill, réglé ou libéré ensuite selon
   * l'issue du paiement — docs/decisions/0007-paiement-momo-manuel.md.
   */
  async create(clientId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsData: {
        productId: string;
        quantity: number;
        unitPrice: number;
        fulfillment: FulfillmentMode;
        fills: {
          source: OrderFillSource;
          sourceId: string | null;
          sellerId: string | null;
          quantity: number;
          unitPrice: number;
        }[];
      }[] = [];

      for (const line of dto.items) {
        const product = await tx.product.findUnique({ where: { id: line.productId } });
        if (!product) throw new NotFoundException(`Produit ${line.productId} introuvable.`);

        const fulfillment = line.fulfillment ?? FulfillmentMode.RETRAIT;
        if (fulfillment === FulfillmentMode.DEPOT && (!product.isStockable || product.isPerishable)) {
          throw new BadRequestException(
            `${product.name} ne peut pas être laissé en dépôt : seuls les produits stockables non périssables le permettent (RG-06).`,
          );
        }

        const reference = await this.referencePrices.latestForProduct(product.id);
        if (!reference) {
          throw new BadRequestException(`${product.name} n'a pas encore de prix publié.`);
        }

        // REV-05 : priorité FIFO aux annonces de revente des autres clients avant le
        // stock propre d'OBP. RG-05 : vendues au prix de référence en vigueur, ici.
        const listings = await tx.resaleListing.findMany({
          where: { productId: product.id, status: ResaleListingStatus.EN_VENTE, sellerId: { not: clientId } },
          orderBy: { createdAt: 'asc' },
        });

        let remaining = line.quantity;
        const fills: { listingId: string; sellerId: string; qty: number; listingQty: number }[] = [];
        for (const listing of listings) {
          if (remaining <= 0) break;
          const qty = Math.min(remaining, listing.quantity);
          fills.push({ listingId: listing.id, sellerId: listing.sellerId, qty, listingQty: listing.quantity });
          remaining -= qty;
        }

        // VEN-11 : ensuite les annonces vendeurs déjà reçues au magasin, FIFO également.
        const vendorListings =
          remaining > 0
            ? await tx.vendorListing.findMany({
                // Les annonces d'un vendeur suspendu ne se vendent plus.
                where: { productId: product.id, status: VendorListingStatus.EN_VENTE, receivedQuantity: { gt: 0 }, vendor: { status: 'ACTIF' } },
                include: { vendor: { select: { userId: true } } },
                orderBy: { createdAt: 'asc' },
              })
            : [];

        const vendorFills: { listingId: string; sellerUserId: string; qty: number; remainingAfter: number }[] = [];
        for (const listing of vendorListings) {
          if (remaining <= 0) break;
          const qty = Math.min(remaining, listing.receivedQuantity);
          vendorFills.push({ listingId: listing.id, sellerUserId: listing.vendor.userId, qty, remainingAfter: listing.receivedQuantity - qty });
          remaining -= qty;
        }

        if (remaining > product.stockQuantity) {
          const totalAvailable =
            listings.reduce((s, l) => s + l.quantity, 0) +
            vendorListings.reduce((s, l) => s + l.receivedQuantity, 0) +
            product.stockQuantity;
          throw new BadRequestException(
            `Stock insuffisant pour ${product.name} : ${totalAvailable} disponible(s) (revente et annonces vendeurs comprises), ${line.quantity} demandé(s).`,
          );
        }

        const lineFills: {
          source: OrderFillSource;
          sourceId: string | null;
          sellerId: string | null;
          quantity: number;
          unitPrice: number;
        }[] = [];

        // Réservation immédiate : le stock ne peut pas être vendu deux fois pendant la
        // vérification du paiement. Le crédit vendeur, lui, attend la confirmation.
        for (const fill of fills) {
          const newQty = fill.listingQty - fill.qty;
          await tx.resaleListing.update({
            where: { id: fill.listingId },
            data: { quantity: newQty, status: newQty === 0 ? ResaleListingStatus.VENDU : ResaleListingStatus.EN_VENTE },
          });
          await tx.stockHolding.update({
            where: { ownerId_productId: { ownerId: fill.sellerId, productId: product.id } },
            data: { quantity: { decrement: fill.qty } },
          });
          lineFills.push({
            source: OrderFillSource.REVENTE,
            sourceId: fill.listingId,
            sellerId: fill.sellerId,
            quantity: fill.qty,
            unitPrice: reference.value,
          });
        }

        for (const fill of vendorFills) {
          await tx.vendorListing.update({
            where: { id: fill.listingId },
            data: {
              receivedQuantity: fill.remainingAfter,
              status: fill.remainingAfter === 0 ? VendorListingStatus.EPUISEE : VendorListingStatus.EN_VENTE,
            },
          });
          lineFills.push({
            source: OrderFillSource.VENDEUR,
            sourceId: fill.listingId,
            sellerId: fill.sellerUserId,
            quantity: fill.qty,
            unitPrice: reference.value,
          });
        }

        if (remaining > 0) {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: remaining } },
          });
          lineFills.push({
            source: OrderFillSource.STOCK_OBP,
            sourceId: null,
            sellerId: null,
            quantity: remaining,
            unitPrice: reference.value,
          });
        }

        totalAmount += reference.value * line.quantity;
        itemsData.push({
          productId: product.id,
          quantity: line.quantity,
          unitPrice: reference.value,
          fulfillment,
          fills: lineFills,
        });
      }

      return tx.order.create({
        data: {
          clientId,
          totalAmount,
          items: {
            create: itemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              fulfillment: item.fulfillment,
              fills: { create: item.fills },
            })),
          },
        },
        include: WITH_PRODUCT,
      });
    });
  }

  /**
   * Le client indique l'opérateur et la référence reçue par SMS après avoir envoyé
   * lui-même l'argent au numéro marchand affiché — aucune API n'est appelée ici, c'est
   * une simple déclaration en attente de vérification humaine (docs/decisions/0007).
   */
  async submitPaymentReference(clientId: string, orderId: string, dto: SubmitPaymentReferenceDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.clientId !== clientId) throw new ForbiddenException('Cette commande ne vous appartient pas.');
    if (order.status !== OrderStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException('Cette commande a déjà une référence de paiement ou a été traitée.');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.EN_VERIFICATION,
        paymentProvider: 'MANUEL',
        paymentMethod: dto.paymentMethod as PaymentMethod,
        paymentReference: dto.paymentReference,
        paymentSubmittedAt: new Date(),
      },
      include: WITH_PRODUCT,
    });
  }

  /**
   * Crée une session de paiement hébergée Nyole (docs/decisions/0008-nyole.md) et
   * renvoie l'URL vers laquelle rediriger le client. La commande reste EN_ATTENTE_PAIEMENT
   * jusqu'à la confirmation automatique par webhook (ou le passage au flux manuel).
   */
  async createNyoleSession(clientId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.clientId !== clientId) throw new ForbiddenException('Cette commande ne vous appartient pas.');
    if (order.status !== OrderStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException('Cette commande a déjà été traitée.');
    }

    const client = await this.prisma.user.findUniqueOrThrow({ where: { id: clientId } });

    const session = await this.nyole.createCheckoutSession({
      amount: order.totalAmount,
      orderId: order.id,
      customerName: client.fullName,
      customerPhone: client.phone,
      description: `Commande OBP Market #${order.id.slice(0, 8)}`,
      successUrl: `${WEB_BASE_URL}/commandes/${order.id}?paiement=succes`,
      cancelUrl: `${WEB_BASE_URL}/commandes/${order.id}/paiement?paiement=annule`,
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentProvider: 'NYOLE', nyoleSessionId: session.id },
    });

    return { url: session.url };
  }

  /**
   * Interroge directement le statut de la session Nyole — filet de sécurité si le
   * webhook n'est jamais arrivé (serveur local sans URL publique, livraison manquée…),
   * recommandé par la doc Nyole elle-même. Appelé au retour du client sur success_url.
   */
  async reconcileNyoleSession(clientId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.clientId !== clientId) throw new ForbiddenException('Cette commande ne vous appartient pas.');

    if (order.paymentProvider === 'NYOLE' && order.nyoleSessionId && order.status === OrderStatus.EN_ATTENTE_PAIEMENT) {
      const remote = await this.nyole.getSessionStatus(order.nyoleSessionId);
      if (remote.paid) {
        await this.confirmPayment(null, orderId);
      } else if (remote.status === 'FAILED' || remote.status === 'CANCELLED') {
        await this.rejectPayment(null, orderId, `Paiement Nyole : ${remote.status.toLowerCase()}.`);
      }
    }

    return this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: WITH_PRODUCT });
  }

  /**
   * Traite un événement webhook Nyole déjà authentifié (signature vérifiée par
   * NyoleWebhookController). Idempotent : un même événement peut arriver plusieurs fois.
   */
  async handleNyoleWebhookEvent(event: NyoleWebhookEvent) {
    const orderId = event.data.metadata?.order_id;
    if (!orderId) return;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentProvider !== 'NYOLE') return;
    if (order.status === OrderStatus.PAYEE || order.status === OrderStatus.ANNULEE) return;

    if (event.event === 'payment.completed' && event.data.status === 'SUCCESS') {
      await this.confirmPayment(null, orderId);
    } else if (event.event === 'payment.failed' || event.event === 'payment.cancelled') {
      await this.rejectPayment(null, orderId, `Paiement Nyole : ${event.data.status.toLowerCase()}.`);
    }
    // payment.updated (ex. REFUNDED) : pas de traitement automatique — un remboursement
    // après vente déjà réglée demande une reprise manuelle (stock, crédits déjà versés),
    // voir docs/decisions/0008-nyole.md.
  }

  /** File d'attente du back-office — paiements déclarés par les clients à vérifier manuellement. */
  findPendingPayments() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.EN_VERIFICATION },
      include: { ...WITH_PRODUCT, client: { select: SAFE_USER_SELECT } },
      orderBy: { paymentSubmittedAt: 'asc' },
    });
  }

  /**
   * Le paiement est confirmé — soit automatiquement par le webhook Nyole (actorId nul),
   * soit par un gestionnaire qui a retrouvé le dépôt manuel sur son compte Mobile Money.
   * C'est ici, et seulement ici, que les vendeurs (revente/vendeurs partenaires) sont
   * crédités et que le bon de retrait / dépôt est généré — jamais avant, pour ne pas
   * payer un vendeur sur une commande jamais réglée par le client.
   */
  async confirmPayment(actorId: string | null, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { fills: true, product: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status !== OrderStatus.EN_VERIFICATION && order.status !== OrderStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException("Cette commande n'est pas en attente de paiement.");
    }

    // Vendeurs à prévenir une fois la transaction réussie.
    const sellerNotices: { sellerId: string; text: string }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        for (const fill of item.fills) {
          if (fill.settledAt) continue;

          if (fill.sellerId && (fill.source === OrderFillSource.REVENTE || fill.source === OrderFillSource.VENDEUR)) {
            const rate = fill.source === OrderFillSource.REVENTE ? RESALE_COMMISSION_RATE : VENDOR_COMMISSION_RATE;
            const net = fill.unitPrice * fill.quantity * (1 - rate);
            sellerNotices.push({
              sellerId: fill.sellerId,
              text: `${fill.quantity} ${item.product.unitLabel} de ${item.product.name} vendu(s) : ${Math.round(net).toLocaleString('fr-FR')} F crédités sur votre portefeuille.`,
            });
          }

          if (fill.source === OrderFillSource.REVENTE && fill.sellerId) {
            const gross = fill.unitPrice * fill.quantity;
            const commission = gross * RESALE_COMMISSION_RATE;
            await tx.walletTransaction.create({
              data: {
                ownerId: fill.sellerId,
                amount: gross - commission,
                reason: `Vente · ${item.product.name} · ${fill.quantity} ${item.product.unitLabel} (commission ${(RESALE_COMMISSION_RATE * 100).toFixed(0)} %)`,
              },
            });
            await tx.stockMovement.create({
              data: {
                ownerId: fill.sellerId,
                productId: item.productId,
                kind: StockMovementKind.REVENTE,
                quantity: fill.quantity,
                unitValue: fill.unitPrice,
              },
            });
          } else if (fill.source === OrderFillSource.VENDEUR && fill.sellerId) {
            const gross = fill.unitPrice * fill.quantity;
            const commission = gross * VENDOR_COMMISSION_RATE;
            await tx.walletTransaction.create({
              data: {
                ownerId: fill.sellerId,
                amount: gross - commission,
                reason: `Vente vendeur · ${item.product.name} · ${fill.quantity} ${item.product.unitLabel} (commission ${(VENDOR_COMMISSION_RATE * 100).toFixed(0)} %)`,
              },
            });
          }

          await tx.orderFill.update({ where: { id: fill.id }, data: { settledAt: new Date() } });
        }

        if (item.fulfillment === FulfillmentMode.DEPOT) {
          // Dépôt : le produit reste chez OBP, à ce client (DEP-01 à DEP-03).
          const existing = await tx.stockHolding.findUnique({
            where: { ownerId_productId: { ownerId: order.clientId, productId: item.productId } },
          });
          const newQuantity = (existing?.quantity ?? 0) + item.quantity;
          const newAvgCost = existing
            ? (existing.avgUnitCost * existing.quantity + item.unitPrice * item.quantity) / newQuantity
            : item.unitPrice;

          await tx.stockHolding.upsert({
            where: { ownerId_productId: { ownerId: order.clientId, productId: item.productId } },
            create: { ownerId: order.clientId, productId: item.productId, quantity: item.quantity, avgUnitCost: item.unitPrice },
            update: { quantity: newQuantity, avgUnitCost: newAvgCost },
          });

          await tx.stockMovement.create({
            data: {
              ownerId: order.clientId,
              productId: item.productId,
              kind: StockMovementKind.DEPOT,
              quantity: item.quantity,
              unitValue: item.unitPrice,
            },
          });
        } else {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { withdrawalCode: await uniqueWithdrawalCode(tx) },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAYEE, paidAt: new Date(), confirmedById: actorId },
      });
    });

    await this.audit.log(await this.actorFor(actorId), 'Paiement confirmé', `Commande ${orderId.slice(0, 8)}`, `${Math.round(order.totalAmount).toLocaleString('fr-FR')} F${actorId ? '' : ' (automatique, passerelle)'}`);
    await this.notifications.notify(order.clientId, {
      title: 'Paiement confirmé',
      body: 'Votre commande est payée. Retrouvez vos bons de retrait ou vos produits en dépôt.',
      href: `/commandes/${orderId}`,
    });
    for (const n of sellerNotices) {
      await this.notifications.notify(n.sellerId, { title: 'Vous avez fait une vente', body: n.text, href: '/portefeuille' });
    }

    return this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: WITH_PRODUCT });
  }

  /**
   * Le gestionnaire n'a pas retrouvé le dépôt (référence invalide, montant erroné…) :
   * la commande est annulée et tout le stock réservé est immédiatement remis en vente.
   */
  async rejectPayment(actorId: string | null, orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { fills: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status !== OrderStatus.EN_VERIFICATION && order.status !== OrderStatus.EN_ATTENTE_PAIEMENT) {
      throw new BadRequestException('Cette commande a déjà été réglée ou annulée.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        for (const fill of item.fills) {
          if (fill.releasedAt || fill.settledAt) continue;

          if (fill.source === OrderFillSource.REVENTE && fill.sourceId && fill.sellerId) {
            await tx.resaleListing.update({
              where: { id: fill.sourceId },
              data: { quantity: { increment: fill.quantity }, status: ResaleListingStatus.EN_VENTE },
            });
            await tx.stockHolding.update({
              where: { ownerId_productId: { ownerId: fill.sellerId, productId: item.productId } },
              data: { quantity: { increment: fill.quantity } },
            });
          } else if (fill.source === OrderFillSource.VENDEUR && fill.sourceId) {
            await tx.vendorListing.update({
              where: { id: fill.sourceId },
              data: { receivedQuantity: { increment: fill.quantity }, status: VendorListingStatus.EN_VENTE },
            });
          } else if (fill.source === OrderFillSource.STOCK_OBP) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: fill.quantity } },
            });
          }

          await tx.orderFill.update({ where: { id: fill.id }, data: { releasedAt: new Date() } });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ANNULEE,
          confirmedById: actorId,
          rejectionReason: reason ?? null,
        },
      });
    });

    await this.audit.log(await this.actorFor(actorId), 'Paiement rejeté', `Commande ${orderId.slice(0, 8)}`, reason ?? undefined);
    await this.notifications.notify(order.clientId, {
      title: 'Paiement non retrouvé',
      body: reason ? `Votre commande a été annulée : ${reason}` : "Votre commande a été annulée car le paiement n'a pas pu être vérifié. Contactez-nous si vous avez payé.",
      href: `/commandes/${orderId}`,
    });

    return this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: WITH_PRODUCT });
  }

  /** Auteur d'une action pour le journal : le gestionnaire connecté, ou « Système » pour la confirmation automatique. */
  private async actorFor(actorId: string | null) {
    if (!actorId) return null;
    const user = await this.prisma.user.findUnique({ where: { id: actorId }, select: { fullName: true } });
    return { userId: actorId, userName: user?.fullName ?? 'Inconnu' };
  }

  // ---- Back-office : suivi des commandes et retrait au magasin ----

  /** Liste des commandes pour le personnel, filtrable par statut et par recherche (n° de commande, nom ou téléphone du client). */
  async findAllForAdmin(params: { status?: OrderStatus; q?: string; take?: number; skip?: number }) {
    const q = params.q?.trim();
    return this.prisma.order.findMany({
      where: {
        status: params.status,
        ...(q
          ? { OR: [{ id: { contains: q, mode: 'insensitive' } }, { client: { phone: { contains: q } } }, { client: { fullName: { contains: q, mode: 'insensitive' } } }] }
          : {}),
      },
      include: { client: { select: SAFE_USER_SELECT }, items: { include: { product: { select: { id: true, name: true, unitLabel: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.take ?? 100, 300),
      skip: params.skip ?? 0,
    });
  }

  async findOneForAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: { select: SAFE_USER_SELECT },
        confirmedBy: { select: SAFE_USER_SELECT },
        items: { include: { product: { include: { category: true } }, fills: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  private async withdrawableItems(code: string) {
    return this.prisma.orderItem.findMany({
      where: { withdrawalCode: code.trim(), withdrawnAt: null, order: { status: OrderStatus.PAYEE } },
      include: { product: { select: { name: true, unitLabel: true } }, order: { select: { id: true, client: { select: SAFE_USER_SELECT } } } },
    });
  }

  /** Vérifie un bon de retrait présenté au magasin, sans le consommer. */
  async previewWithdrawal(code: string) {
    const items = await this.withdrawableItems(code);
    if (items.length === 0) throw new NotFoundException('Bon de retrait invalide, déjà utilisé, ou commande non payée.');
    return items.map((i) => ({
      itemId: i.id,
      orderId: i.order.id,
      client: i.order.client,
      product: i.product.name,
      unitLabel: i.product.unitLabel,
      quantity: i.quantity,
    }));
  }

  /** Remet la marchandise au client : le bon est consommé, et la commande passe « Retirée » quand tout est remis. */
  async withdraw(code: string, actor: { userId?: string | null; userName?: string | null }) {
    const items = await this.withdrawableItems(code);
    if (items.length === 0) throw new NotFoundException('Bon de retrait invalide, déjà utilisé, ou commande non payée.');
    if (items.length > 1) throw new BadRequestException('Ce code correspond à plusieurs bons : ouvrez la commande concernée pour les remettre un par un.');

    const item = items[0];
    const orderId = item.order.id;

    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.update({ where: { id: item.id }, data: { withdrawnAt: new Date() } });
      const remaining = await tx.orderItem.count({ where: { orderId, withdrawalCode: { not: null }, withdrawnAt: null } });
      if (remaining === 0) await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.RETIREE } });
    });

    await this.audit.log(actor, 'Retrait au magasin', `Commande ${orderId.slice(0, 8)}`, `${item.quantity} × ${item.product.name} remis à ${item.order.client.fullName}`);
    await this.notifications.notify(item.order.client.id, {
      title: 'Retrait effectué',
      body: `${item.quantity} ${item.product.unitLabel} de ${item.product.name} remis au magasin. Merci de votre confiance.`,
      href: `/commandes/${orderId}`,
    });
    return { orderId, product: item.product.name, quantity: item.quantity, client: item.order.client.fullName };
  }

  findMine(clientId: string) {
    return this.prisma.order.findMany({
      where: { clientId },
      include: WITH_PRODUCT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForClient(clientId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: WITH_PRODUCT,
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.clientId !== clientId) throw new ForbiddenException('Cette commande ne vous appartient pas.');
    return order;
  }
}
