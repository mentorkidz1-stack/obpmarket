import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PriceReadingsService } from './price-readings.service.js';
import { CreatePriceReadingDto } from './dto/create-price-reading.dto.js';
import { ReviewPriceReadingDto } from './dto/review-price-reading.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('price-readings')
export class PriceReadingsController {
  constructor(private readonly priceReadings: PriceReadingsService) {}

  @Post()
  create(@Body() dto: CreatePriceReadingDto) {
    return this.priceReadings.create(dto);
  }

  /** File d'attente du back-office — BO-04. */
  @Get('to-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  findToReview() {
    return this.priceReadings.findToReview();
  }

  /** Réservé au personnel : la réponse contient l'agent qui a fait chaque relevé (le public passe par /products/:id/reference-price/markets). */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  findForProduct(@Query('productId') productId: string) {
    return this.priceReadings.findForProduct(productId);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  approve(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewPriceReadingDto) {
    return this.priceReadings.approve(id, req.userId!, dto);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  reject(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewPriceReadingDto) {
    return this.priceReadings.reject(id, req.userId!, dto);
  }
}
