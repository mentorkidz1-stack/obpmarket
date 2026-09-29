import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ResaleListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeAvailableQuantity } from '../common/stock-availability.util.js';
import type { CreateResaleListingDto } from './dto/create-resale-listing.dto.js';

const WITH_PRODUCT = { product: { include: { category: true } } } as const;

@Injectable()
export class ResaleService {
  constructor(private readonly prisma: PrismaService) {}

  /** REV-01 : le prix n'est pas fixé ici — RG-05 l'impose au prix de référence en vigueur à l'achat. */
  async create(sellerId: string, dto: CreateResaleListingDto) {
    const { available } = await computeAvailableQuantity(this.prisma, sellerId, dto.productId);
    if (available < dto.quantity) {
      throw new BadRequestException(`Vous n'avez que ${available} unité(s) disponible(s) pour la revente.`);
    }

    return this.prisma.resaleListing.create({
      data: { sellerId, productId: dto.productId, quantity: dto.quantity },
      include: WITH_PRODUCT,
    });
  }

  findMine(sellerId: string) {
    return this.prisma.resaleListing.findMany({
      where: { sellerId },
      include: WITH_PRODUCT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** REV-06 : annulable tant que rien n'est vendu. */
  async cancel(sellerId: string, id: string) {
    const listing = await this.prisma.resaleListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable.');
    if (listing.sellerId !== sellerId) throw new ForbiddenException("Cette annonce ne vous appartient pas.");
    if (listing.status !== ResaleListingStatus.EN_VENTE) {
      throw new BadRequestException('Cette annonce ne peut plus être annulée.');
    }

    return this.prisma.resaleListing.update({
      where: { id },
      data: { status: ResaleListingStatus.ANNULE, cancelledAt: new Date() },
    });
  }
}
