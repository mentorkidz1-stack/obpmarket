import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { sendDataUri } from '../common/photos.js';
import { BannersService } from './banners.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  findActive() {
    return this.banners.findActive();
  }

  /** Back-office. */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  findAll() {
    return this.banners.findAll();
  }

  /** Image de la bannière, mise en cache par le navigateur et le CDN. */
  @Get(':id/image')
  async image(@Param('id') id: string, @Res() res: Response) {
    const banner = await this.banners.findOne(id);
    if (!sendDataUri(res, banner.imageUrl)) throw new NotFoundException('Image introuvable.');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  create(@Body() dto: CreateBannerDto) {
    return this.banners.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.banners.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}
