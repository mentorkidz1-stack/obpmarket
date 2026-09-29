import { Controller, Get } from '@nestjs/common';
import { ReferencePricesService } from './reference-prices.service.js';

/** Prix du jour, tous produits — écran d'accueil (CAT-05, PRI-06). */
@Controller('reference-prices')
export class ReferencePricesListController {
  constructor(private readonly referencePrices: ReferencePricesService) {}

  @Get()
  latestForAll() {
    return this.referencePrices.latestForAllProducts();
  }
}
