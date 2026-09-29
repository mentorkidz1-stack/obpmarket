import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorService } from './vendor.service.js';
import { CreateVendorListingDto } from './dto/create-vendor-listing.dto.js';
import { ReviewDto } from './dto/review.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('vendor-listings')
export class VendorListingController {
  constructor(private readonly vendor: VendorService) {}

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
  approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.vendor.approveListing(id, req.userId!);
  }

  @Post(':id/request-correction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  requestCorrection(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.vendor.requestCorrection(id, req.userId!, dto);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  reject(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.vendor.rejectListing(id, req.userId!, dto);
  }

  @Post(':id/mark-received')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  markReceived(@Param('id') id: string) {
    return this.vendor.markReceived(id);
  }
}
