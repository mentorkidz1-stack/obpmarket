import { Module } from '@nestjs/common';
import { MarketsService } from './markets.service.js';
import { MarketsController } from './markets.controller.js';

@Module({
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
