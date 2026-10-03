import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminStaffService } from './admin-staff.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminStatsService, AdminStaffService],
})
export class AdminModule {}
