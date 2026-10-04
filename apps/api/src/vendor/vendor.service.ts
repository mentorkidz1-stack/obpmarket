import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { VendorListingStatus, VendorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SAFE_USER_SELECT } from '../common/safe-user.select.js';
import { parsePhotoArray } from '../common/photos.js';
import { ReferencePricesService } from '../reference-prices/reference-prices.service.js';
import type { CreateVendorProfileDto } from './dto/create-vendor-profile.dto.js';
import type { CreateVendorListingDto } from './dto/create-vendor-listing.dto.js';
import type { ReviewDto } from './dto/review.dto.js';
import { DepotsService } from '../depots/depots.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { UpdateVendorListingDto, UpdateVendorProfileDto } from './dto/update-vendor-listing.dto.js';

/// RG-16 : fourchette autorisée autour du prix de référence — à confirmer avec la direction.
const VENDOR_PRICE_BAND = Number(process.env.VENDOR_PRICE_BAND ?? 0.1);

const WITH_LISTING_RELATIONS = {
  product: { include: { category: true } },
  vendor: { include: { user: { select: SAFE_USER_SELECT } } },
  depot: { select: { id: true, name: true, city: true } },
} as const;

@Injectable()
export class VendorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referencePrices: ReferencePricesService,
    private readonly notifications: NotificationsService,
    private readonly depots: DepotsService,
  ) {}

  // ---------- Compte vendeur (VEN-01 à VEN-03) ----------

  async becomeVendor(userId: string, dto: CreateVendorProfileDto) {
    const existing = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (existing) {
      // Une demande refusée peut être redéposée, corrigée ; tout autre état est déjà un compte.
      if (existing.status !== VendorStatus.REFUSE) throw new ConflictException('Vous avez déjà un compte vendeur.');
      return this.prisma.vendorProfile.update({
        where: { id: existing.id },
        data: { type: dto.type, zone: dto.zone, paymentInfo: dto.paymentInfo, status: VendorStatus.EN_ATTENTE, rejectionReason: null, reviewedAt: null },
      });
    }

    return this.prisma.vendorProfile.create({
      data: { userId, type: dto.type, zone: dto.zone, paymentInfo: dto.paymentInfo },
    });
  }

  /** Le vendeur met à jour sa zone et ses coordonnées de paiement (sans repasser par la validation). */
  async updateProfile(userId: string, dto: UpdateVendorProfileDto) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException("Vous n'avez pas de compte vendeur.");
    return this.prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: { zone: dto.zone?.trim() || undefined, paymentInfo: dto.paymentInfo?.trim() || undefined },
    });
  }

  /** Tous les vendeurs, avec leur activité, pour le suivi du back-office. */
  findAllVendors() {
    return this.prisma.vendorProfile.findMany({
      include: {
        user: { select: SAFE_USER_SELECT },
        _count: { select: { listings: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async suspendVendor(id: string, reason?: string) {
    await this.findVendorOrThrow(id);
    const vendor = await this.prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.SUSPENDU, rejectionReason: reason ?? null, reviewedAt: new Date() },
    });
    await this.notifyVendor(id, 'Compte vendeur suspendu', reason ? `Motif : ${reason}. Vos annonces ne sont plus en vente.` : 'Vos annonces ne sont plus en vente. Contactez OBP Market.');
    return vendor;
  }

  async reactivateVendor(id: string) {
    const vendor = await this.findVendorOrThrow(id);
    if (vendor.status !== VendorStatus.SUSPENDU) throw new BadRequestException("Ce compte n'est pas suspendu.");
    const updated = await this.prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.ACTIF, rejectionReason: null, reviewedAt: new Date() },
    });
    await this.notifyVendor(id, 'Compte vendeur réactivé', 'Votre compte vendeur est de nouveau actif.');
    return updated;
  }

  private async findVendorOrThrow(id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendeur introuvable.');
    return vendor;
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

  /** Prévient le vendeur (cloche du site, et WhatsApp s'il l'a accepté). */
  private async notifyVendor(vendorId: string, title: string, body: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id: vendorId }, select: { userId: true } });
    if (vendor) await this.notifications.notify(vendor.userId, { title, body, href: '/vendeur' });
  }

  async approveVendor(id: string) {
    const vendor = await this.prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.ACTIF, reviewedAt: new Date(), rejectionReason: null },
    });
    await this.notifyVendor(id, 'Compte vendeur validé', 'Votre compte vendeur est actif : vous pouvez publier votre première annonce.');
    return vendor;
  }

  async rejectVendor(id: string, reason?: string) {
    const vendor = await this.prisma.vendorProfile.update({
      where: { id },
      data: { status: VendorStatus.REFUSE, reviewedAt: new Date(), rejectionReason: reason ?? null },
    });
    await this.notifyVendor(id, 'Demande vendeur non retenue', reason ? `Motif : ${reason}. Vous pouvez refaire une demande.` : 'Vous pouvez refaire une demande.');
    return vendor;
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
    // Mêmes règles que le formulaire : seuls les produits stockables non périssables se déposent au magasin.
    if (!product.isStockable || product.isPerishable) {
      throw new BadRequestException('Ce produit ne peut pas être proposé par un vendeur (produit frais ou non stockable).');
    }

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

  private async ownListingOrThrow(userId: string, id: string) {
    const listing = await this.prisma.vendorListing.findUnique({ where: { id }, include: { vendor: { select: { userId: true } } } });
    if (!listing || listing.vendor.userId !== userId) throw new NotFoundException('Annonce introuvable.');
    return listing;
  }

  /** Le vendeur corrige son annonce (en attente ou à corriger) : elle repart en modération. */
  async updateListing(userId: string, id: string, dto: UpdateVendorListingDto) {
    await this.requireActiveVendor(userId);
    const listing = await this.ownListingOrThrow(userId, id);
    if (listing.status !== VendorListingStatus.EN_ATTENTE && listing.status !== VendorListingStatus.A_CORRIGER) {
      throw new BadRequestException("Cette annonce ne peut plus être modifiée : elle a déjà été traitée.");
    }
    return this.prisma.vendorListing.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        photos: dto.photos ? JSON.stringify(dto.photos) : undefined,
        status: VendorListingStatus.EN_ATTENTE,
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
      },
      include: WITH_LISTING_RELATIONS,
    });
  }

  /** Le vendeur retire une annonce qui n'est pas encore en vente. */
  async cancelListing(userId: string, id: string) {
    const listing = await this.ownListingOrThrow(userId, id);
    const cancellable: VendorListingStatus[] = [
      VendorListingStatus.EN_ATTENTE,
      VendorListingStatus.A_CORRIGER,
      VendorListingStatus.REFUSEE,
      VendorListingStatus.VALIDEE,
    ];
    if (!cancellable.includes(listing.status)) {
      throw new BadRequestException('Cette annonce est en vente ou épuisée : contactez OBP Market pour la retirer.');
    }
    await this.prisma.vendorListing.delete({ where: { id } });
    return { deleted: true };
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
    const updated = await this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.VALIDEE,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
      include: WITH_LISTING_RELATIONS,
    });
    await this.notifyVendor(updated.vendorId, 'Annonce validée', `« ${updated.product.name} » est validée. Déposez le stock au magasin OBP Market pour la mettre en vente.`);
    return updated;
  }

  async requestCorrection(id: string, reviewedById: string, dto: ReviewDto) {
    const listing = await this.findListingOrThrow(id);
    this.assertAwaitingReview(listing.status);
    if (!dto.reason) throw new BadRequestException('Un motif est nécessaire pour demander une correction.');
    const updated = await this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.A_CORRIGER,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: WITH_LISTING_RELATIONS,
    });
    await this.notifyVendor(updated.vendorId, 'Annonce à corriger', `« ${updated.product.name} » : ${dto.reason}`);
    return updated;
  }

  async rejectListing(id: string, reviewedById: string, dto: ReviewDto) {
    const listing = await this.findListingOrThrow(id);
    this.assertAwaitingReview(listing.status);
    if (!dto.reason) throw new BadRequestException('Un motif est nécessaire pour refuser une annonce.');
    const updated = await this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.REFUSEE,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: WITH_LISTING_RELATIONS,
    });
    await this.notifyVendor(updated.vendorId, 'Annonce refusée', `« ${updated.product.name} » : ${dto.reason}`);
    return updated;
  }

  /** Photo d'une annonce en vente (affichée sur la vitrine publique) ; rien pour une annonce non publique. */
  async publicListingPhoto(id: string, index: number): Promise<string | undefined> {
    const listing = await this.prisma.vendorListing.findUnique({ where: { id }, select: { photos: true, status: true, vendor: { select: { status: true } } } });
    if (!listing || listing.vendor.status !== 'ACTIF') return undefined;
    if (listing.status !== VendorListingStatus.EN_VENTE && listing.status !== VendorListingStatus.EPUISEE) return undefined;
    return parsePhotoArray(listing.photos)[index];
  }

  /** RG-14 : l'annonce ne devient achetable qu'à réception effective au magasin. */
  async markReceived(id: string, receivedQuantity?: number, depotId?: string) {
    const listing = await this.findListingOrThrow(id);
    if (listing.status !== VendorListingStatus.VALIDEE) {
      throw new BadRequestException('Cette annonce doit être validée avant réception.');
    }
    if (depotId) await this.depots.assertUsable(depotId);
    else if (await this.depots.hasActiveDepots()) throw new BadRequestException('Indiquez le dépôt qui a reçu la marchandise.');
    const received = receivedQuantity ?? listing.quantity;
    if (received > listing.quantity) {
      throw new BadRequestException(`La quantité reçue ne peut pas dépasser la quantité annoncée (${listing.quantity}).`);
    }
    const updated = await this.prisma.vendorListing.update({
      where: { id },
      data: {
        status: VendorListingStatus.EN_VENTE,
        receivedQuantity: received,
        receivedAt: new Date(),
        depotId: depotId ?? null,
      },
      include: WITH_LISTING_RELATIONS,
    });
    await this.notifyVendor(updated.vendorId, 'Stock reçu, annonce en vente', `« ${updated.product.name} » : ${received} ${updated.product.unitLabel} en vente sur le site.`);
    return updated;
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
