import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { NyoleWebhookController } from './nyole-webhook.controller.js';
import { ReferencePricesModule } from '../reference-prices/reference-prices.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NyoleModule } from '../nyole/nyole.module.js';

@Module({
  imports: [ReferencePricesModule, AuthModule, NyoleModule],
  controllers: [OrdersController, NyoleWebhookController],
  providers: [OrdersService],
})
export class OrdersModule {}
