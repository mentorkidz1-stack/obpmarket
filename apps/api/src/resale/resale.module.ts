import { Module } from '@nestjs/common';
import { ResaleService } from './resale.service.js';
import { ResaleController } from './resale.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ResaleController],
  providers: [ResaleService],
})
export class ResaleModule {}
