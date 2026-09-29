import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { VendorListingStatus, VendorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import type { CreateVendorProfileDto } from './dto/create-vendor-profile.dto.js';
import type { CreateVendorListingDto } from './dto/create-vendor-listing.dto.js';
import type { ReviewDto } from './dto/review.dto.js';

/// RG-16 : fourchette autorisée autour du prix de référence — à confirmer avec la direction.
const VENDOR_PRICE_BAND = Number(process.env.VENDOR_PRICE_BAND ?? 0.1);

const WITH_LISTING_RELATIONS = {
  product: { include: { category: true } },
  vendor: { include: { user: { select: SAFE_USER_SELECT } } },
} as const;

@Injectable()
export class VendorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
  ) {}

  // ---------- Compte vendeur (VEN-01 à VEN-03) ----------

  async becomeVendor(userId: string, dto: CreateVendorProfileDto) {
    const existing = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Vous avez déjà un compte vendeur.');

    return this.prisma.vendorProfile.create({
      data: { userId, type: dto.type, zone: dto.zone, paymentInfo: dto.paymentInfo },
    });
  }

  myProfile(userId: string) {
    return this.prisma.vendorProfile.findUnique({ where: { userId } });
  }

  findPendingVendors() {
    return this.prisma.vendorProfile.findMany({
      where: { status: VendorStatus.EN_ATTENTE },
      include: { user: { select: SAFE_USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  approveVendor(id: string) {
    return this.prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.ACTIF, reviewedAt: new Date(), rejectionReason: null },
    });
  }

  rejectVendor(id: string, reason?: string) {
    return this.prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.REFUSE, reviewedAt: new Date(), rejectionReason: reason ?? null },
    });
  }

  // ---------- Annonces (VEN-04 à VEN-13) ----------

  private async requireActiveVendor(userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException("Vous n'avez pas de compte vendeur.");
    if (vendor.status !== VendorStatus.ACTIF) {
      throw new ForbiddenException('Votre compte vendeur doit être validé par OBP Market avant de publier une annonce.');
    }
    return vendor;
  }

  async createListing(userId: string, dto: CreateVendorListingDto) {
    const vendor = await this.requireActiveVendor(userId);

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Produit introuvable.');

    return this.prisma.vendorListing.create({
      data: {
        vendorId: vendor.id,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        photos: JSON.stringify(dto.photos ?? []),
      },
      include: WITH_LISTING_RELATIONS,
    });
  }

  async myListings(userId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) return [];
    return this.prisma.vendorListing.findMany({
      where: { vendorId: vendor.id },
      include: WITH_LISTING_RELATIONS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingListings() {
    const listings = await this.prisma.vendorListing.findMany({
      where: { status: { in: [VendorListingStatus.EN_ATTENTE, VendorListingStatus.VALIDEE] } },
      include: WITH_LISTING_RELATIONS,
      orderBy: { createdAt: 'asc' },
    });

    // RG-16 : signale au modérateur les annonces dont le prix sort de la fourchette.
    return Promise.all(
      listings.map(async (l) => {
        const reference = await this.referencePrices.latestForProduct(l.productId);
        const deviation = reference ? (l.unitPrice - reference.value) / reference.value : null;
        return {
          ...l,
          referencePrice: reference?.value ?? null,
          priceOutOfBand: deviation != null ? Math.abs(deviation) > VENDOR_PRICE_BAND : false,
        };
      }),
    );
  }

  async approveListing(id: string, reviewedById: string) {
    const listing = await this.findListingOrThrow(id);
    this.assertAwaitingReview(listing.status);
    return this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.VALIDEE,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
      include: WITH_LISTING_RELATIONS,
    });
  }

  async requestCorrection(id: string, reviewedById: string, dto: ReviewDto) {
    const listing = await this.findListingOrThrow(id);
    this.assertAwaitingReview(listing.status);
    if (!dto.reason) throw new BadRequestException('Un motif est nécessaire pour demander une correction.');
    return this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.A_CORRIGER,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: WITH_LISTING_RELATIONS,
    });
  }

  async rejectListing(id: string, reviewedById: string, dto: ReviewDto) {
    const listing = await this.findListingOrThrow(id);
    this.assertAwaitingReview(listing.status);
    if (!dto.reason) throw new BadRequestException('Un motif est nécessaire pour refuser une annonce.');
    return this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.REFUSEE,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: WITH_LISTING_RELATIONS,
    });
  }

  /** RG-14 : l'annonce ne devient achetable qu'à réception effective au magasin. */
  async markReceived(id: string) {
    const listing = await this.findListingOrThrow(id);
    if (listing.status !== VendorListingStatus.VALIDEE) {
      throw new BadRequestException('Cette annonce doit être validée avant réception.');
    }
    return this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.EN_VENTE,
        receivedQuantity: listing.quantity,
        receivedAt: new Date(),
      },
      include: WITH_LISTING_RELATIONS,
    });
  }

  private async findListingOrThrow(id: string) {
    const listing = await this.prisma.vendorListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable.');
    return listing;
  }

  private assertAwaitingReview(status: VendorListingStatus) {
    if (status !== VendorListingStatus.EN_ATTENTE) {
      throw new BadRequestException('Cette annonce a déjà été traitée.');
    }
  }
}
