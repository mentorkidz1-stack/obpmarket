import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { WhatsAppService } from './whatsapp.service.js';
import { AuthModule } from '../auth/auth.module.js';

/** Global : n'importe quel module peut notifier un utilisateur sans importer celui-ci. */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, WhatsAppService],
  exports: [NotificationsService, WhatsAppService],
})
export class NotificationsModule {}
