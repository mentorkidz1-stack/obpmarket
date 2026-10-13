import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Quand beaucoup de requêtes arrivent en même temps sur une base distante un peu lente, le pool de connexions se
 * remplit et les requêtes en trop échouaient au bout de 10 s (erreur 500). On leur laisse 30 s, sauf si l'adresse de la
 * base fixe déjà ces réglages.
 */
function withPoolDefaults(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '30');
    if (!u.searchParams.has('connect_timeout')) u.searchParams.set('connect_timeout', '20');
    return u.toString();
  } catch {
    return url;
  }
}

const CONNECT_ATTEMPTS = 6;
const RETRY_DELAY_MS = 4000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Les transactions (commande, paiement, retrait) coupaient à 5 s par défaut : sur une base distante un peu lente,
   * elles échouaient en erreur 500 alors que tout allait bien. On leur laisse jusqu'à 30 s.
   */
  constructor() {
    super({ datasourceUrl: withPoolDefaults(process.env.DATABASE_URL), transactionOptions: { maxWait: 10_000, timeout: 30_000 } });
  }

  /**
   * Se connecte avec quelques nouvelles tentatives : sur l'hébergement gratuit, la base peut répondre
   * lentement ou être momentanément injoignable au démarrage. Plutôt que de faire planter l'API (et de la
   * laisser hors ligne), on réessaie avant d'abandonner.
   */
  async onModuleInit() {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        if (attempt >= CONNECT_ATTEMPTS) throw err;
        this.logger.warn(`Base de données injoignable (essai ${attempt}/${CONNECT_ATTEMPTS}), nouvelle tentative…`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
