import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { sendDataUri } from '../common/photos.js';
import { BannersService } from './banners.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('banners')
export class BannersController {
  constructor(
    private readonly banners: BannersService,
    private readonly audit: AuditService,
  ) {}

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
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBannerDto) {
    const r = await this.banners.create(dto);
    await this.audit.log(req, 'Bannière créée', r.title);
    return r;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const r = await this.banners.update(id, dto);
    await this.audit.log(req, 'Bannière modifiée', r.title, Object.keys(dto).filter((k) => k !== 'imageUrl').join(', '));
    return r;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.banners.remove(id);
    await this.audit.log(req, 'Bannière supprimée', `Bannière ${id.slice(0, 8)}`);
    return r;
  }
}
