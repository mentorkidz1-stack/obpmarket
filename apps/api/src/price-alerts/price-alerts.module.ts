import { Module } from '@nestjs/common';
import { PriceAlertsController } from './price-alerts.controller.js';
import { PriceAlertsService } from './price-alerts.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [PriceAlertsController],
  providers: [PriceAlertsService],
  exports: [PriceAlertsService],
})
export class PriceAlertsModule {}
