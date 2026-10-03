import { Body, Controller, Get, Ip, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ContactService } from './contact.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Public : formulaire de contact du site. */
  @Post()
  create(@Body() dto: CreateContactMessageDto, @Ip() ip: string) {
    return this.contact.create(dto, ip);
  }

  /** Back-office. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  findAll() {
    return this.contact.findAll();
  }

  @Patch(':id/handled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  setHandled(@Param('id') id: string, @Body() body: { handled?: boolean }) {
    return this.contact.setHandled(id, body.handled !== false);
  }
}
