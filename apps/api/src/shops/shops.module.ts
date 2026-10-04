import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ReferencePricesModule } from '../reference-prices/reference-prices.module.js';
import { ShopsController } from './shops.controller.js';
import { ShopsService } from './shops.service.js';

@Module({
  imports: [AuthModule, ReferencePricesModule],
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
