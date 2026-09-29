import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get('mine')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.stock.findMine(req.userId!);
  }
}
