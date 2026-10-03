import { Body, Controller, Delete, Get, Ip, NotFoundException, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { parsePhotoArray, sendDataUri } from '../common/photos.js';
import { PropertiesService } from './properties.service.js';
import { CreateInquiryDto, CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

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
  create(@Body() dto: CreatePropertyDto) {
    return this.properties.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.properties.remove(id);
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
