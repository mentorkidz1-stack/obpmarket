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
  async latest(@Param('productId') productId: string) {
    return this.referencePrices.toSelling(await this.referencePrices.latestForProduct(productId));
  }

  /** Prix relevé dans chaque marché : réservé au personnel (le public ne voit que le prix affiché). */
  @Get('markets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.GESTIONNAIRE_LIQUIDITE, Role.ADMIN)
  markets(@Param('productId') productId: string) {
    return this.referencePrices.marketsForProduct(productId);
  }

  @Get('history')
  async history(@Param('productId') productId: string, @Query('days') days?: string) {
    return this.referencePrices.toSellingMany(await this.referencePrices.historyForProduct(productId, days ? Number(days) : undefined));
  }

  /** Recalcul manuel (dépannage, back-office) — le recalcul normal se déclenche après chaque relevé. Réservé au personnel (était public). */
  @Post('recompute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  recompute(@Param('productId') productId: string) {
    return this.referencePrices.recomputeForProduct(productId);
  }
}
