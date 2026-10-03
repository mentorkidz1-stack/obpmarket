import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service.js';
import { DepotsService } from './depots.service.js';
import { CreateDepotDto, CreateZoneDto, UpdateDepotDto, UpdateZoneDto } from './dto/depot.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

const MANAGE = [Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE];

@Controller()
export class DepotsController {
  constructor(
    private readonly depots: DepotsService,
    private readonly audit: AuditService,
  ) {}

  // ---- Dépôts ----

  /** Dépôts ouverts : lecture publique (affichage « disponible au dépôt de… »). */
  @Get('depots')
  findActive() {
    return this.depots.findActive();
  }

  @Get('depots/admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE, Role.MODERATEUR, Role.AGENT_MAGASIN)
  findAll() {
    return this.depots.findAll();
  }

  @Post('depots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateDepotDto) {
    const r = await this.depots.create(dto);
    await this.audit.log(req, 'Dépôt créé', `${r.name} (${r.city})`);
    return r;
  }

  @Patch('depots/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateDepotDto) {
    const r = await this.depots.update(id, dto);
    await this.audit.log(req, dto.active === undefined ? 'Dépôt modifié' : dto.active ? 'Dépôt réactivé' : 'Dépôt désactivé', `${r.name} (${r.city})`);
    return r;
  }

  @Delete('depots/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.depots.remove(id);
    await this.audit.log(req, 'Dépôt supprimé', r.name);
    return { deleted: r.deleted };
  }

  // ---- Zones de livraison ----

  @Get('delivery-zones')
  findActiveZones() {
    return this.depots.findActiveZones();
  }

  @Get('delivery-zones/admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  findAllZones() {
    return this.depots.findAllZones();
  }

  @Post('delivery-zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  async createZone(@Req() req: AuthenticatedRequest, @Body() dto: CreateZoneDto) {
    const r = await this.depots.createZone(dto);
    await this.audit.log(req, 'Zone de livraison créée', r.name, `${r.fee} F`);
    return r;
  }

  @Patch('delivery-zones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  async updateZone(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateZoneDto) {
    const r = await this.depots.updateZone(id, dto);
    await this.audit.log(req, 'Zone de livraison modifiée', r.name, dto.fee === undefined ? undefined : `frais ${r.fee} F`);
    return r;
  }

  @Delete('delivery-zones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  async removeZone(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const r = await this.depots.removeZone(id);
    await this.audit.log(req, 'Zone de livraison supprimée', r.name);
    return { deleted: r.deleted };
  }
}
