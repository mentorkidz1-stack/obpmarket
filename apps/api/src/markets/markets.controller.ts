import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { MarketsService } from './markets.service.js';
import { CreateMarketDto } from './dto/create-market.dto.js';
import { UpdateMarketDto } from './dto/update-market.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

const MANAGE = [Role.GESTIONNAIRE_PRIX, Role.ADMIN];

@Controller('markets')
export class MarketsController {
  constructor(private readonly markets: MarketsService) {}

  // ---- Public : nom, ville et position des marchés suivis ----

  @Get()
  findAll() {
    return this.markets.findAll();
  }

  // ---- Agent de terrain connecté ----

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@Req() req: AuthenticatedRequest) {
    return this.markets.findAssignedTo(req.userId!);
  }

  // ---- Back-office ----

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  adminAll() {
    return this.markets.findAllForAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateMarketDto) {
    return this.markets.create(dto, req);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateMarketDto) {
    return this.markets.update(id, dto, req);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.markets.remove(id, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.markets.findOne(id);
  }

  @Get(':id/agents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  findAgents(@Param('id') id: string) {
    return this.markets.findAgents(id);
  }

  @Post(':id/agents/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  assignAgent(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('agentId') agentId: string) {
    return this.markets.assignAgent(id, agentId, req);
  }

  @Delete(':id/agents/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE)
  unassignAgent(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('agentId') agentId: string) {
    return this.markets.unassignAgent(id, agentId, req);
  }
}
