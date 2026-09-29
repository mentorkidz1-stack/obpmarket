import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { WithdrawDto } from './dto/withdraw.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('mine')
  mine(@Req() req: AuthenticatedRequest) {
    return this.wallet.summary(req.userId!);
  }

  @Post('withdraw')
  withdraw(@Req() req: AuthenticatedRequest, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(req.userId!, dto.amount);
  }
}
