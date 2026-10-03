import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsNumber, IsPositive, IsString } from 'class-validator';
import { PriceAlertsService } from './price-alerts.service.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

class CreatePriceAlertDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @IsPositive()
  targetPrice!: number;
}

@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
export class PriceAlertsController {
  constructor(private readonly alerts: PriceAlertsService) {}

  @Post()
  upsert(@Req() req: AuthenticatedRequest, @Body() dto: CreatePriceAlertDto) {
    return this.alerts.upsert(req.userId!, dto.productId, dto.targetPrice);
  }

  @Get()
  mine(@Req() req: AuthenticatedRequest) {
    return this.alerts.mine(req.userId!);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.alerts.remove(req.userId!, id);
  }
}
