import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DepotsController } from './depots.controller.js';
import { DepotsService } from './depots.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DepotsController],
  providers: [DepotsService],
  exports: [DepotsService],
})
export class DepotsModule {}
