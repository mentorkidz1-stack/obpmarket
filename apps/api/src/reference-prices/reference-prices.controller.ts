import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReferencePricesService } from './reference-prices.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('products/:productId/reference-price')
export class ReferencePricesController {
  constructor(private readonly referencePrices: ReferencePricesService) {}

  @Get()
  latest(@Param('productId') productId: string) {
    return this.referencePrices.latestForProduct(productId);
  }

  /** Prix par marché (public, sans données d'agent). */
  @Get('markets')
  markets(@Param('productId') productId: string) {
    return this.referencePrices.marketsForProduct(productId);
  }

  @Get('history')
  history(@Param('productId') productId: string, @Query('days') days?: string) {
    return this.referencePrices.historyForProduct(productId, days ? Number(days) : undefined);
  }

  /** Recalcul manuel (dépannage, back-office) — le recalcul normal se déclenche après chaque relevé. Réservé au personnel (était public). */
  @Post('recompute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  recompute(@Param('productId') productId: string) {
    return this.referencePrices.recomputeForProduct(productId);
  }
}
