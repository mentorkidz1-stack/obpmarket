import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(ownerId: string) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    return { balance, transactions };
  }

  /**
   * Débite le portefeuille et enregistre le retrait comme mouvement — le versement réel
   * vers le compte Mobile Money du client se fait hors API, pas de passerelle branchée
   * (docs/decisions/0003-boutique-v1.md). Le libellé reste neutre pour le client.
   */
  async withdraw(ownerId: string, amount: number) {
    if (!amount || amount <= 0) throw new BadRequestException('Montant invalide.');
    const { balance } = await this.summary(ownerId);
    if (amount > balance) throw new BadRequestException('Solde insuffisant.');

    await this.prisma.walletTransaction.create({
      data: { ownerId, amount: -amount, reason: 'Retrait vers Mobile Money' },
    });
    return this.summary(ownerId);
  }
}
