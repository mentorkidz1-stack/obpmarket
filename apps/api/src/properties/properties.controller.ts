import { Body, Controller, Delete, Get, Ip, NotFoundException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { parsePhotoArray, sendDataUri } from '../common/photos.js';
import { PropertiesService } from './properties.service.js';
import { CreateInquiryDto, CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly properties: PropertiesService,
    private readonly audit: AuditService,
  ) {}

  // ---- Public ----

  @Get()
  findPublished() {
    return this.properties.findPublished();
  }

  // ---- Back-office (OBP Market publie elle-même ses biens) ----
  // Ces routes à plusieurs segments passent avant « :id ».

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  findAll() {
    return this.properties.findAll();
  }

  @Get('admin/inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  findInquiries() {
    return this.properties.findInquiries();
  }

  @Patch('inquiries/:id/handled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  setInquiryHandled(@Param('id') id: string, @Body() body: { handled?: boolean }) {
    return this.properties.setInquiryHandled(id, body.handled !== false);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePropertyDto) {
    const r = await this.properties.create(dto);
    await this.audit.log(req, 'Bien immobilier créé', r.title, `${r.kind} · ${r.city}`);
    return r;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    const r = await this.properties.update(id, dto);
    await this.audit.log(req, 'Bien immobilier modifié', r.title, Object.keys(dto).filter((k) => k !== 'photos').join(', '));
    return r;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.properties.remove(id);
    await this.audit.log(req, 'Bien immobilier supprimé', `Bien ${id.slice(0, 8)}`);
    return r;
  }

  // ---- Public (suite) ----

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.properties.findPublishedOne(id);
  }

  /** Image d'une photo du bien, mise en cache par le navigateur et le CDN. */
  @Get(':id/photo/:index')
  async photo(@Param('id') id: string, @Param('index') index: string, @Res() res: Response) {
    const property = await this.properties.findPublishedOne(id);
    if (!sendDataUri(res, parsePhotoArray(property.photos)[Number(index)])) throw new NotFoundException('Photo introuvable.');
  }

  @Post(':id/inquiries')
  createInquiry(@Param('id') id: string, @Body() dto: CreateInquiryDto, @Ip() ip: string) {
    return this.properties.createInquiry(id, dto, ip);
  }
}
