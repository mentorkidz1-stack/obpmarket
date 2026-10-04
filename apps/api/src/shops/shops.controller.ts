import { Body, Controller, Get, Ip, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ShopsService } from './shops.service.js';
import { ShopEventDto, UpdateShopDto } from './dto/shop.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  /** Annuaire public des boutiques vendeurs. */
  @Get()
  list() {
    return this.shops.list();
  }

  // Les routes « mine » passent avant « :slug ».

  /** Espace vendeur : ma vitrine et mes statistiques. */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@Req() req: AuthenticatedRequest) {
    return this.shops.myShop(req.userId!);
  }

  @Put('mine')
  @UseGuards(JwtAuthGuard)
  updateMine(@Req() req: AuthenticatedRequest, @Body() dto: UpdateShopDto) {
    return this.shops.updateMyShop(req.userId!, dto);
  }

  @Get(':slug')
  findOne(@Req() req: Request, @Param('slug') slug: string) {
    return this.shops.findBySlug(req, slug);
  }

  /** Compteur anonyme : visite, partage ou clic sur WhatsApp. */
  @Post(':slug/events')
  event(@Param('slug') slug: string, @Body() dto: ShopEventDto, @Ip() ip: string) {
    return this.shops.recordEvent(slug, dto.kind, ip);
  }
}
