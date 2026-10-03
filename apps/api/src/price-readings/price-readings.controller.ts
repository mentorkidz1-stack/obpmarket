import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PriceReadingsService } from './price-readings.service.js';
import { CreatePriceReadingDto } from './dto/create-price-reading.dto.js';
import { ReviewPriceReadingDto } from './dto/review-price-reading.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from '../audit/audit.service.js';

@Controller('price-readings')
export class PriceReadingsController {
  constructor(
    private readonly priceReadings: PriceReadingsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Relevé de prix. Réservé aux agents de terrain connectés (le relevé leur est attribué, pas à un agent choisi
   * dans le formulaire) et aux gestionnaires de prix. Cette route était publique : n'importe qui pouvait fausser les prix.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePriceReadingDto) {
    return this.priceReadings.create(dto, req.userId!, req.userRole === Role.AGENT);
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
  async approve(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewPriceReadingDto) {
    const r = await this.priceReadings.approve(id, req.userId!, dto);
    await this.audit.log(req, 'Relevé de prix validé', `Relevé ${id.slice(0, 8)}`, dto.note);
    return r;
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  async reject(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: ReviewPriceReadingDto) {
    const r = await this.priceReadings.reject(id, req.userId!, dto);
    await this.audit.log(req, 'Relevé de prix rejeté', `Relevé ${id.slice(0, 8)}`, dto.note);
    return r;
  }
}
