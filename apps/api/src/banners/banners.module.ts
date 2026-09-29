import { Module } from '@nestjs/common';
import { BannersService } from './banners.service.js';
import { BannersController } from './banners.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
