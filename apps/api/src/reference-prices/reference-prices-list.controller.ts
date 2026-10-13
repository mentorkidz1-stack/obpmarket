import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ReferencePricesService } from './reference-prices.service.js';

/** Prix du jour, tous produits — écran d'accueil (CAT-05, PRI-06). */
@Controller('reference-prices')
export class ReferencePricesListController {
  constructor(private readonly referencePrices: ReferencePricesService) {}

  /**
   * Moyenne brute des relevés, avec le nombre de relevés et de marchés : pour les agents de terrain et le personnel
   * (contrôle des relevés, offres de rachat). Jamais publique : elle révélerait la méthode de calcul du prix affiché.
   */
  @Get('market')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AGENT, Role.GESTIONNAIRE_PRIX, Role.GESTIONNAIRE_LIQUIDITE, Role.MODERATEUR, Role.ADMIN)
  marketAverages() {
    return this.referencePrices.latestForAllProducts();
  }

  @Get()
  async latestForAll() {
    return this.referencePrices.toSellingMany(await this.referencePrices.latestForAllProducts());
  }
}
