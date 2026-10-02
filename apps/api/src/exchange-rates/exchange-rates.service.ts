import { Injectable, Logger } from '@nestjs/common';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'NGN', 'GHS'] as const;
type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** Parité fixe du FCFA (XOF) avec l'euro : 1 EUR = 655,957 XOF. */
const XOF_PER_EUR = 655.957;

/** Taux indicatifs (1 XOF = x devise), utilisés seulement si la source en ligne est injoignable. */
const FALLBACK_RATES: Record<Currency, number> = {
  EUR: 1 / XOF_PER_EUR,
  USD: 0.0018,
  NGN: 2.6,
  GHS: 0.02,
};

const TTL_MS = 12 * 60 * 60 * 1000;

export interface RatesSnapshot {
  base: 'XOF';
  rates: Record<Currency, number>;
  updatedAt: string;
  source: 'live' | 'fallback';
}

/**
 * Taux de change pour l'affichage uniquement : les prix, stocks et paiements restent en FCFA.
 * L'euro est calculé sur la parité fixe ; les autres devises viennent d'une source publique, mise en cache 12 h.
 */
@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private cache: RatesSnapshot | null = null;
  private fetchedAt = 0;

  async get(): Promise<RatesSnapshot> {
    if (this.cache && Date.now() - this.fetchedAt < TTL_MS) return this.cache;

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/XOF', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
      if (body.result !== 'success' || !body.rates) throw new Error('réponse inattendue');

      const rates = { ...FALLBACK_RATES };
      for (const c of SUPPORTED_CURRENCIES) {
        const r = body.rates[c];
        if (c !== 'EUR' && typeof r === 'number' && r > 0) rates[c] = r;
      }
      this.cache = { base: 'XOF', rates, updatedAt: new Date().toISOString(), source: 'live' };
      this.fetchedAt = Date.now();
    } catch (err) {
      this.logger.warn(`Taux de change indisponibles (${err instanceof Error ? err.message : err}), repli sur les derniers connus.`);
      if (!this.cache) {
        this.cache = { base: 'XOF', rates: FALLBACK_RATES, updatedAt: new Date().toISOString(), source: 'fallback' };
      }
      // On réessaie dans 15 minutes plutôt que de marteler la source.
      this.fetchedAt = Date.now() - TTL_MS + 15 * 60 * 1000;
    }
    return this.cache;
  }
}
