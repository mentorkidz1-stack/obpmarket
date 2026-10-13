import { Module } from '@nestjs/common';
import { StockService } from './stock.service.js';
import { StockController } from './stock.controller.js';
import { StorageFeesService } from './storage-fees.service.js';
import { ReferencePricesModule } from '../reference-prices/reference-prices.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [ReferencePricesModule, AuthModule],
  controllers: [StockController],
  providers: [StockService, StorageFeesService],
  exports: [StorageFeesService],
})
export class StockModule {}
