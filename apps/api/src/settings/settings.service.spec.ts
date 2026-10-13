import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SettingsService } from './settings.service.js';
import { StorageFeesService } from '../stock/storage-fees.service.js';

const DAY = 24 * 60 * 60 * 1000;
const service = new SettingsService({} as never);
const s = DEFAULT_SETTINGS;

describe('prix affiché', () => {
  it('majore le prix moyen des marchés de 7,5 %', () => {
    expect(service.sellingPrice(20_000, s)).toBe(21_500);
    expect(service.sellingPrice(21_536.67, s)).toBe(23_152);
  });

  it('suit le pourcentage réglé, y compris 0', () => {
    expect(service.sellingPrice(10_000, { ...s, markupPct: 10 })).toBe(11_000);
    expect(service.sellingPrice(10_000, { ...s, markupPct: 0 })).toBe(10_000);
  });
});

describe('TVA', () => {
  it('applique le taux par défaut (18 %) quand le produit n\'a pas de taux propre', () => {
    expect(service.vatRateFor(null, s)).toBe(18);
    expect(service.vatRateFor(undefined, s)).toBe(18);
  });

  it('respecte un taux propre, et un produit exonéré (0)', () => {
    expect(service.vatRateFor(5, s)).toBe(5);
    expect(service.vatRateFor(0, s)).toBe(0);
  });

  it('ne taxe rien quand la TVA est désactivée', () => {
    expect(service.vatRateFor(18, { ...s, vatEnabled: false })).toBe(0);
    expect(service.vatRateFor(null, { ...s, vatEnabled: false })).toBe(0);
  });
});

describe('frais de stockage', () => {
  const since = new Date('2026-01-01T00:00:00Z');
  const at = (days: number) => new Date(since.getTime() + days * DAY);

  it('est gratuit pendant la durée gratuite (30 jours)', () => {
    expect(service.storageFee(10, 20_000, since, s, at(0))).toBe(0);
    expect(service.storageFee(10, 20_000, since, s, at(30))).toBe(0);
  });

  it('applique 2,5 % du prix d\'achat dès le 31e jour', () => {
    // 10 unités à 20 000 F = 200 000 F ; 2,5 % = 5 000 F.
    expect(service.storageFee(10, 20_000, since, s, at(31))).toBe(5_000);
  });

  it('ajoute 2,5 % par mois entamé quand les frais sont mensuels', () => {
    expect(service.storageFee(10, 20_000, since, s, at(60))).toBe(5_000);
    expect(service.storageFee(10, 20_000, since, s, at(61))).toBe(10_000);
    expect(service.storageFee(10, 20_000, since, s, at(100))).toBe(15_000);
  });

  it('ne s\'applique qu\'une fois quand les frais ne sont pas mensuels', () => {
    const once = { ...s, storageFeeMonthly: false };
    expect(service.storageFee(10, 20_000, since, once, at(31))).toBe(5_000);
    expect(service.storageFee(10, 20_000, since, once, at(200))).toBe(5_000);
  });

  it('suit le pourcentage et la durée gratuite réglés', () => {
    const custom = { ...s, storageFreeDays: 10, storageFeePct: 4 };
    expect(service.storageFee(1, 100_000, since, custom, at(10))).toBe(0);
    expect(service.storageFee(1, 100_000, since, custom, at(11))).toBe(4_000);
  });
});

describe('lots de stock (le plus ancien d\'abord)', () => {
  function withMovements(movements: Array<{ kind: 'DEPOT' | 'REVENTE' | 'LIQUIDITE'; quantity: number; unitValue: number; createdAt: Date }>) {
    const prisma = { stockMovement: { findMany: async () => movements } };
    const settings = { get: async () => DEFAULT_SETTINGS, storageFee: service.storageFee.bind(service), freeUntil: service.freeUntil.bind(service) };
    return new StorageFeesService(prisma as never, settings as never);
  }
  const now = new Date('2026-04-01T00:00:00Z');
  const old = new Date('2026-01-01T00:00:00Z');
  const recent = new Date('2026-03-25T00:00:00Z');

  it('reconstitue les lots restants après une revente', async () => {
    const fees = withMovements([
      { kind: 'DEPOT', quantity: 10, unitValue: 20_000, createdAt: old },
      { kind: 'DEPOT', quantity: 5, unitValue: 22_000, createdAt: recent },
      { kind: 'REVENTE', quantity: 4, unitValue: 23_000, createdAt: recent },
    ]);
    const lots = await fees.lots('u', 'p');
    expect(lots.map((l) => l.quantity)).toEqual([6, 5]);
  });

  it('retient les frais sur les unités les plus anciennes pour une vente', async () => {
    const fees = withMovements([
      { kind: 'DEPOT', quantity: 10, unitValue: 20_000, createdAt: old },
      { kind: 'DEPOT', quantity: 5, unitValue: 22_000, createdAt: recent },
    ]);
    // 3 unités du lot ancien (90 jours : 2 mois entamés après le premier) : 3 × 20 000 × 2,5 % × 2 = 3 000.
    expect(await fees.feeForSale('u', 'p', 3, 0, now)).toBe(3_000);
    // 12 unités : 10 anciennes (10 000) + 2 récentes (gratuites).
    expect(await fees.feeForSale('u', 'p', 12, 0, now)).toBe(10_000);
  });

  it('ne facture rien pour un lot encore dans la durée gratuite', async () => {
    const fees = withMovements([{ kind: 'DEPOT', quantity: 5, unitValue: 22_000, createdAt: recent }]);
    expect(await fees.feeForSale('u', 'p', 5, 0, now)).toBe(0);
  });
});
