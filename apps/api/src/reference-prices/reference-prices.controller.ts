import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReferencePricesService } from './reference-prices.service.js';

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

  /** Recalcul manuel (dépannage, back-office) — le recalcul normal se déclenche après chaque relevé. */
  @Post('recompute')
  recompute(@Param('productId') productId: string) {
    return this.referencePrices.recomputeForProduct(productId);
  }
}
