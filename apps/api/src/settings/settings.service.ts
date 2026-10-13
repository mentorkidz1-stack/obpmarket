import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ShopSettingsValues {
  vatEnabled: boolean;
  /** Taux de TVA par défaut, en %. */
  vatRate: number;
  /** Mode d'affichage proposé à l'arrivée : « TTC » (avec taxe) ou « HT » (hors taxe). */
  vatDefaultDisplay: 'TTC' | 'HT';
  /** Majoration du prix moyen des marchés pour obtenir le prix affiché, en %. */
  markupPct: number;
  storageFreeDays: number;
  /** Frais de stockage, en % du prix d'achat. */
  storageFeePct: number;
  /** Vrai : à chaque mois entamé après la durée gratuite ; faux : une seule fois. */
  storageFeeMonthly: boolean;
}

/** Valeurs de la commande du client (18 % de TVA, +7,5 % sur le prix moyen, 30 jours gratuits puis 2,5 %). */
export const DEFAULT_SETTINGS: ShopSettingsValues = {
  vatEnabled: true,
  vatRate: 18,
  vatDefaultDisplay: 'TTC',
  markupPct: 7.5,
  storageFreeDays: 30,
  storageFeePct: 2.5,
  storageFeeMonthly: true,
};

const CACHE_MS = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SettingsService {
  private cache: { at: number; values: ShopSettingsValues } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Réglages en vigueur (mis en cache quelques secondes : appelés à chaque affichage de prix). */
  async get(): Promise<ShopSettingsValues> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.values;
    const row = await this.prisma.shopSettings.findUnique({ where: { id: 'default' } });
    const values: ShopSettingsValues = row
      ? {
          vatEnabled: row.vatEnabled,
          vatRate: row.vatRate,
          vatDefaultDisplay: row.vatDefaultDisplay === 'HT' ? 'HT' : 'TTC',
          markupPct: row.markupPct,
          storageFreeDays: row.storageFreeDays,
          storageFeePct: row.storageFeePct,
          storageFeeMonthly: row.storageFeeMonthly,
        }
      : { ...DEFAULT_SETTINGS };
    this.cache = { at: Date.now(), values };
    return values;
  }

  async update(patch: Partial<ShopSettingsValues>): Promise<ShopSettingsValues> {
    await this.prisma.shopSettings.upsert({ where: { id: 'default' }, create: { id: 'default', ...patch }, update: patch });
    this.cache = null;
    return this.get();
  }

  /** Prix affiché (hors taxe) : le prix moyen des marchés majoré du pourcentage réglé. Arrondi au franc. */
  sellingPrice(marketValue: number, s: ShopSettingsValues): number {
    return Math.round(marketValue * (1 + s.markupPct / 100));
  }

  /** Taux de TVA réellement appliqué à un produit : exonéré (0) si la TVA est désactivée ou si le produit l'est. */
  vatRateFor(productVatRate: number | null | undefined, s: ShopSettingsValues): number {
    if (!s.vatEnabled) return 0;
    return productVatRate ?? s.vatRate;
  }

  /** Nombre de frais de stockage dus pour une durée de conservation (en jours) : 0 pendant la durée gratuite. */
  storagePeriods(daysHeld: number, s: ShopSettingsValues): number {
    if (daysHeld <= s.storageFreeDays) return 0;
    return s.storageFeeMonthly ? Math.ceil((daysHeld - s.storageFreeDays) / 30) : 1;
  }

  /** Frais de stockage d'un lot (quantité × prix d'achat unitaire) conservé depuis `since`. */
  storageFee(quantity: number, unitCost: number, since: Date, s: ShopSettingsValues, now = new Date()): number {
    const days = Math.floor((now.getTime() - since.getTime()) / DAY_MS);
    return Math.round(quantity * unitCost * (s.storageFeePct / 100) * this.storagePeriods(days, s));
  }

  /** Date jusqu'à laquelle la conservation est gratuite. */
  freeUntil(since: Date, s: ShopSettingsValues): Date {
    return new Date(since.getTime() + s.storageFreeDays * DAY_MS);
  }
}
