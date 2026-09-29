import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LiquidityService } from './liquidity.service.js';
import { CreateLiquidityRequestDto } from './dto/create-liquidity-request.dto.js';
import { OfferLiquidityDto } from './dto/offer-liquidity.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('liquidity-requests')
export class LiquidityController {
  constructor(private readonly liquidity: LiquidityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLiquidityRequestDto) {
    return this.liquidity.create(req.userId!, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthenticatedRequest) {
    return this.liquidity.findMine(req.userId!);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.liquidity.accept(req.userId!, id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.liquidity.reject(req.userId!, id);
  }

  /** Back-office (BO-06). */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_LIQUIDITE, Role.ADMIN)
  findPending() {
    return this.liquidity.findPending();
  }

  @Post(':id/offer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTIONNAIRE_LIQUIDITE, Role.ADMIN)
  offer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: OfferLiquidityDto) {
    return this.liquidity.offer(id, req.userId!, dto);
  }
}
