import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service.js';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto.js';
import { UpdateVendorProfileDto } from './dto/update-vendor-listing.dto.js';
import { ReviewDto } from './dto/review.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from '../audit/audit.service.js';

@Controller('vendor-profile')
export class VendorProfileController {
  constructor(
    private readonly vendor: VendorService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  becomeVendor(@Req() req: AuthenticatedRequest, @Body() dto: CreateVendorProfileDto) {
    return this.vendor.becomeVendor(req.userId!, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@Req() req: AuthenticatedRequest) {
    return this.vendor.myProfile(req.userId!);
  }

  @Patch('mine')
  @UseGuards(JwtAuthGuard)
  updateMine(@Req() req: AuthenticatedRequest, @Body() dto: UpdateVendorProfileDto) {
    return this.vendor.updateProfile(req.userId!, dto);
  }

  /** Back-office : tous les vendeurs. */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  all() {
    return this.vendor.findAllVendors();
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async suspend(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewDto) {
    const r = await this.vendor.suspendVendor(id, dto.reason);
    await this.audit.log(req, 'Vendeur suspendu', `Vendeur ${id.slice(0, 8)}`, dto.reason);
    return r;
  }

  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async reactivate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.vendor.reactivateVendor(id);
    await this.audit.log(req, 'Vendeur réactivé', `Vendeur ${id.slice(0, 8)}`);
    return r;
  }

  /** Back-office (BO-12). */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  pending() {
    return this.vendor.findPendingVendors();
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.vendor.approveVendor(id);
    await this.audit.log(req, 'Compte vendeur validé', `Vendeur ${id.slice(0, 8)}`);
    return r;
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async reject(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewDto) {
    const r = await this.vendor.rejectVendor(id, dto.reason);
    await this.audit.log(req, 'Compte vendeur refusé', `Vendeur ${id.slice(0, 8)}`, dto.reason);
    return r;
  }
}
