import { Module } from '@nestjs/common';
import { ReferencePricesService } from './reference-prices.service.js';
import { ReferencePricesController } from './reference-prices.controller.js';
import { ReferencePricesListController } from './reference-prices-list.controller.js';

@Module({
  controllers: [ReferencePricesController, ReferencePricesListController],
  providers: [ReferencePricesService],
  exports: [ReferencePricesService],
})
export class ReferencePricesModule {}
