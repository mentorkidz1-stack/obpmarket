import { Body, Controller, Get, Ip, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorInvitesService } from './vendor-invites.service.js';
import { CreateVendorInviteDto } from './dto/vendor-invite.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { SlidingLimiter } from '../auth/otp-limiter.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

/** Évite qu'on teste des jetons au hasard : 30 vérifications par minute et par adresse. */
const checkLimiter = new SlidingLimiter(30, 60_000, 'Trop de vérifications, réessayez dans une minute.');

@Controller('vendor-invites')
export class VendorInvitesController {
  constructor(
    private readonly invites: VendorInvitesService,
    private readonly audit: AuditService,
  ) {}

  /** Public : l'invité voit si son lien est valide avant de se connecter. */
  @Get('check/:token')
  check(@Param('token') token: string, @Ip() ip: string) {
    checkLimiter.hit(ip);
    return this.invites.check(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  list() {
    return this.invites.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateVendorInviteDto) {
    const invite = await this.invites.create(req.userId!, dto);
    await this.audit.log(req, 'Invitation vendeur créée', dto.note.trim(), dto.phone ? `réservée au ${dto.phone}` : undefined);
    return invite;
  }

  @Post(':id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATEUR, Role.ADMIN)
  async revoke(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const invite = await this.invites.revoke(id);
    await this.audit.log(req, 'Invitation vendeur annulée', invite.note);
    return invite;
  }
}
