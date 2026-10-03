import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsAppService } from './whatsapp.service.js';

export interface NotificationInput {
  title: string;
  body: string;
  /** Page du site vers laquelle mène la notification. */
  href?: string;
}

/**
 * Point d'entrée unique des notifications : une entrée dans le site (cloche) est toujours créée ;
 * l'envoi WhatsApp s'y ajoute seulement si le canal est configuré ET si le client l'a accepté.
 * Aucune erreur d'envoi ne remonte à l'appelant : une notification ne doit jamais faire échouer une commande.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async notify(userId: string, input: NotificationInput): Promise<void> {
    try {
      await this.prisma.notification.create({ data: { userId, title: input.title, body: input.body, href: input.href ?? null } });

      if (this.whatsapp.isConfigured()) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true, whatsappOptIn: true } });
        if (user?.whatsappOptIn) await this.whatsapp.sendNotification(user.phone, `${input.title} — ${input.body}`);
      }
    } catch (err) {
      this.logger.warn(`Notification non envoyée à ${userId} : ${err instanceof Error ? err.message : err}`);
    }
  }

  async list(userId: string) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 40 }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, unread };
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async preferences(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { whatsappOptIn: true } });
    return { whatsappOptIn: user.whatsappOptIn, whatsappAvailable: this.whatsapp.isConfigured() };
  }

  async setPreferences(userId: string, whatsappOptIn: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { whatsappOptIn } });
    return this.preferences(userId);
  }
}
