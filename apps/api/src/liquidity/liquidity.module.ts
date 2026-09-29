import { Module } from '@nestjs/common';
import { LiquidityService } from './liquidity.service.js';
import { LiquidityController } from './liquidity.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [LiquidityController],
  providers: [LiquidityService],
})
export class LiquidityModule {}
