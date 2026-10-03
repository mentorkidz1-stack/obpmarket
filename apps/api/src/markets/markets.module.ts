import { Module } from '@nestjs/common';
import { MarketsService } from './markets.service.js';
import { MarketsController } from './markets.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
