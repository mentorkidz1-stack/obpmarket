import { BadRequestException, Controller, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { NyoleService, type NyoleWebhookEvent } from '../nyole/nyole.service.js';
import { OrdersService } from './orders.service.js';

/**
 * Reçoit les webhooks signés Nyole (docs/decisions/0008-nyole.md). Route publique par
 * nature — l'authenticité vient de la signature HMAC, pas d'un jeton.
 */
@Controller('webhooks/nyole')
export class NyoleWebhookController {
  constructor(
    private readonly nyole: NyoleService,
    private readonly orders: OrdersService,
  ) {}

  @Post()
  async handle(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody;
    if (!rawBody || !this.nyole.verifyWebhookSignature(rawBody, req.headers as Record<string, string>)) {
      throw new BadRequestException('Signature invalide.');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as NyoleWebhookEvent;
    await this.orders.handleNyoleWebhookEvent(event);
    return { received: true };
  }
}
