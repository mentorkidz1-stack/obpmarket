import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

class PreferencesDto {
  @IsBoolean()
  whatsappOptIn!: boolean;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.notifications.list(req.userId!);
  }

  /** Léger : interrogé régulièrement par la cloche. */
  @Get('unread-count')
  async unread(@Req() req: AuthenticatedRequest) {
    return { unread: await this.notifications.unreadCount(req.userId!) };
  }

  @Post('read-all')
  readAll(@Req() req: AuthenticatedRequest) {
    return this.notifications.markAllRead(req.userId!);
  }

  @Get('preferences')
  preferences(@Req() req: AuthenticatedRequest) {
    return this.notifications.preferences(req.userId!);
  }

  @Patch('preferences')
  setPreferences(@Req() req: AuthenticatedRequest, @Body() dto: PreferencesDto) {
    return this.notifications.setPreferences(req.userId!, dto.whatsappOptIn);
  }
}
