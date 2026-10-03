import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminStaffService, TEAM_ROLES } from './admin-staff.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateStaffDto, DisableDto, UpdateStaffDto } from './dto/admin.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

const ALL_STAFF = [Role.GESTIONNAIRE_PRIX, Role.GESTIONNAIRE_LIQUIDITE, Role.MODERATEUR, Role.AGENT_MAGASIN, Role.ADMIN];

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly stats: AdminStatsService,
    private readonly staff: AdminStaffService,
    private readonly audit: AuditService,
  ) {}

  /** Tableau de bord : chiffres clés, tâches en attente, alertes. Visible par tout le personnel. */
  @Get('stats')
  @Roles(...ALL_STAFF)
  overview() {
    return this.stats.overview();
  }

  // ---- Équipe (administrateur) ----

  @Get('staff')
  @Roles(Role.ADMIN)
  listStaff() {
    return this.staff.list();
  }

  @Post('staff')
  @Roles(Role.ADMIN)
  createStaff(@Req() req: AuthenticatedRequest, @Body() dto: CreateStaffDto) {
    if (!TEAM_ROLES.includes(dto.role)) throw new BadRequestException('Rôle invalide pour un compte du personnel.');
    return this.staff.create(dto, req);
  }

  @Patch('staff/:id')
  @Roles(Role.ADMIN)
  updateStaff(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    if (dto.role && !TEAM_ROLES.includes(dto.role)) throw new BadRequestException('Rôle invalide pour un compte du personnel.');
    return this.staff.update(id, dto, req);
  }

  @Post('staff/:id/reset-password')
  @Roles(Role.ADMIN)
  resetPassword(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.staff.resetPassword(id, req);
  }

  /** Agents de terrain (pour les affecter aux marchés). */
  @Get('agents')
  @Roles(Role.GESTIONNAIRE_PRIX, Role.ADMIN)
  agents() {
    return this.staff.agents();
  }

  // ---- Clients ----

  @Get('customers')
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE)
  customers(@Query('q') q?: string) {
    return this.staff.customers(q);
  }

  @Patch('customers/:id')
  @Roles(Role.ADMIN)
  setCustomerDisabled(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: DisableDto) {
    return this.staff.setCustomerDisabled(id, dto.disabled, req);
  }

  // ---- Journal d'activité ----

  @Get('audit')
  @Roles(Role.ADMIN)
  auditLog(@Query('take') take?: string, @Query('skip') skip?: string, @Query('actorId') actorId?: string, @Query('action') action?: string) {
    return this.audit.list({ take: take ? Number(take) : undefined, skip: skip ? Number(skip) : undefined, actorId, action });
  }
}
