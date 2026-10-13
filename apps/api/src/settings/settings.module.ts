import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

/** Global : les prix, les commandes, les alertes et le stock lisent tous ces réglages. */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
