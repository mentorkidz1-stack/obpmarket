import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service.js';
import { CreateVendorListingDto } from './dto/create-vendor-listing.dto.js';
import { MarkReceivedDto, UpdateVendorListingDto } from './dto/update-vendor-listing.dto.js';
import { ReviewDto } from './dto/review.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from '../audit/audit.service.js';

@Controller('vendor-listings')
export class VendorListingController {
  constructor(
    private readonly vendor: VendorService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateVendorListingDto) {
    return this.vendor.createListing(req.userId!, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@Req() req: AuthenticatedRequest) {
    return this.vendor.myListings(req.userId!);
  }

  /** Le vendeur corrige son annonce : elle repart en modération. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateVendorListingDto) {
    return this.vendor.updateListing(req.userId!, id, dto);
  }

  /** Le vendeur retire une annonce qui n'est pas encore en vente. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.vendor.cancelListing(req.userId!, id);
  }

  /** Back-office (BO-11). */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  pending() {
    return this.vendor.findPendingListings();
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.vendor.approveListing(id, req.userId!);
    await this.audit.log(req, 'Annonce vendeur validée', `Annonce ${r.product.name}`);
    return r;
  }

  @Post(':id/request-correction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async requestCorrection(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewDto) {
    const r = await this.vendor.requestCorrection(id, req.userId!, dto);
    await this.audit.log(req, 'Correction demandée', `Annonce ${r.product.name}`, dto.reason);
    return r;
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async reject(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewDto) {
    const r = await this.vendor.rejectListing(id, req.userId!, dto);
    await this.audit.log(req, 'Annonce vendeur refusée', `Annonce ${r.product.name}`, dto.reason);
    return r;
  }

  @Post(':id/mark-received')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async markReceived(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: MarkReceivedDto) {
    const r = await this.vendor.markReceived(id, dto.receivedQuantity, dto.depotId);
    await this.audit.log(req, 'Stock vendeur reçu au magasin', `Annonce ${r.product.name}`, `${r.receivedQuantity} ${r.product.unitLabel}`);
    return r;
  }
}
