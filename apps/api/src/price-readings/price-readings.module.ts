import { Module } from '@nestjs/common';
import { PriceReadingsService } from './price-readings.service.js';
import { PriceReadingsController } from './price-readings.controller.js';
import { ReferencePricesModule } from '../reference-prices/reference-prices.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [ReferencePricesModule, AuthModule],
  controllers: [PriceReadingsController],
  providers: [PriceReadingsService],
})
export class PriceReadingsModule {}
