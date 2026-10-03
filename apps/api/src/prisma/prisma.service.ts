import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_ATTEMPTS = 6;
const RETRY_DELAY_MS = 4000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

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
