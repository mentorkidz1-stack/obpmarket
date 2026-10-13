import { Injectable } from '@nestjs/common';
import { StockMovementKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService, type ShopSettingsValues } from '../settings/settings.service.js';

export interface StockLot {
  quantity: number;
  /** Prix d'achat unitaire réel (hors taxe) de ce lot. */
  unitCost: number;
  /** Date d'entrée au magasin (paiement de l'achat). */
  since: Date;
}

export interface StorageInfo {
  /** Frais de stockage dus à ce jour pour les unités concernées. */
  feeDue: number;
  /** Fin de la conservation gratuite pour le lot le plus ancien. */
  freeUntil: Date | null;
  /** Vrai quand la durée gratuite est dépassée pour au moins un lot. */
  overdue: boolean;
  feePct: number;
  freeDays: number;
  monthly: boolean;
}

/**
 * Frais de stockage : au-delà de la durée gratuite (30 jours par défaut), un pourcentage du prix d'achat réel
 * (2,5 % par défaut) est dû, une fois ou chaque mois entamé selon les réglages. Les lots sont suivis dans l'ordre
 * d'entrée : le plus ancien est vendu en premier.
 */
@Injectable()
export class StorageFeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Lots restants d'un client pour un produit, reconstitués depuis les mouvements (dépôts, reventes, liquidités). */
  async lots(ownerId: string, productId: string): Promise<StockLot[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: { ownerId, productId },
      orderBy: { createdAt: 'asc' },
      select: { kind: true, quantity: true, unitValue: true, createdAt: true },
    });

    const lots: StockLot[] = [];
    for (const m of movements) {
      if (m.kind === StockMovementKind.DEPOT) {
        lots.push({ quantity: m.quantity, unitCost: m.unitValue, since: m.createdAt });
        continue;
      }
      // Revente ou liquidité : les unités sortent du lot le plus ancien.
      let toRemove = m.quantity;
      while (toRemove > 0 && lots.length > 0) {
        const take = Math.min(toRemove, lots[0].quantity);
        lots[0].quantity -= take;
        toRemove -= take;
        if (lots[0].quantity === 0) lots.shift();
      }
    }
    return lots;
  }

  private feeForLots(lots: StockLot[], units: number, skip: number, s: ShopSettingsValues, now: Date) {
    let remainingSkip = skip;
    let remaining = units;
    let fee = 0;
    let freeUntil: Date | null = null;
    let overdue = false;
    for (const lot of lots) {
      let available = lot.quantity;
      if (remainingSkip > 0) {
        const skipped = Math.min(remainingSkip, available);
        remainingSkip -= skipped;
        available -= skipped;
      }
      if (available <= 0) continue;
      if (remaining <= 0) break;
      const take = Math.min(remaining, available);
      remaining -= take;
      const lotFee = this.settings.storageFee(take, lot.unitCost, lot.since, s, now);
      fee += lotFee;
      const until = this.settings.freeUntil(lot.since, s);
      if (freeUntil === null || until < freeUntil) freeUntil = until;
      if (now > until) overdue = true;
    }
    return { fee, freeUntil, overdue };
  }

  /** Frais dus pour des unités déjà détenues (affichage « Mon stock »). */
  async forHolding(ownerId: string, productId: string, units: number, now = new Date()): Promise<StorageInfo> {
    const s = await this.settings.get();
    const lots = await this.lots(ownerId, productId);
    const { fee, freeUntil, overdue } = this.feeForLots(lots, units, 0, s, now);
    return { feeDue: fee, freeUntil, overdue, feePct: s.storageFeePct, freeDays: s.storageFreeDays, monthly: s.storageFeeMonthly };
  }

  /**
   * Frais à retenir quand `units` unités sont vendues. `skip` : unités déjà attribuées aux lots les plus anciens
   * lors de la même opération (plusieurs lignes de revente du même produit pour le même vendeur).
   */
  async feeForSale(ownerId: string, productId: string, units: number, skip = 0, now = new Date()): Promise<number> {
    const s = await this.settings.get();
    const lots = await this.lots(ownerId, productId);
    return this.feeForLots(lots, units, skip, s, now).fee;
  }

  /** Produit acheté « à retirer » mais pas encore retiré : conservation gratuite depuis le paiement de la commande. */
  async forPickup(paidAt: Date, unitPrice: number, quantity: number, now = new Date()): Promise<StorageInfo> {
    const s = await this.settings.get();
    const freeUntil = this.settings.freeUntil(paidAt, s);
    return {
      feeDue: this.settings.storageFee(quantity, unitPrice, paidAt, s, now),
      freeUntil,
      overdue: now > freeUntil,
      feePct: s.storageFeePct,
      freeDays: s.storageFreeDays,
      monthly: s.storageFeeMonthly,
    };
  }
}
