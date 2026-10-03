import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { PayoutsController, WalletController } from './wallet.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [WalletController, PayoutsController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
