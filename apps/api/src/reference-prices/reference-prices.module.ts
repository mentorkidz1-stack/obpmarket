import { Module } from '@nestjs/common';
import { ReferencePricesService } from './reference-prices.service.js';
import { ReferencePricesController } from './reference-prices.controller.js';
import { ReferencePricesListController } from './reference-prices-list.controller.js';
import { PriceAlertsModule } from '../price-alerts/price-alerts.module.js';

@Module({
  imports: [PriceAlertsModule],
  controllers: [ReferencePricesController, ReferencePricesListController],
  providers: [ReferencePricesService],
  exports: [ReferencePricesService],
})
export class ReferencePricesModule {}
