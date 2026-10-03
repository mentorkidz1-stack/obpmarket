import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PayoutStatus, Role } from '@prisma/client';
import { WalletService } from './wallet.service.js';
import { PayoutPaidDto, PayoutRejectDto, WithdrawDto } from './dto/withdraw.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('mine')
  mine(@Req() req: AuthenticatedRequest) {
    return this.wallet.summary(req.userId!);
  }

  @Get('payouts/mine')
  myPayouts(@Req() req: AuthenticatedRequest) {
    return this.wallet.myPayouts(req.userId!);
  }

  /** Demande de retrait vers Mobile Money : OBP verse ensuite les fonds (voir PayoutsController). */
  @Post('withdraw')
  withdraw(@Req() req: AuthenticatedRequest, @Body() dto: WithdrawDto) {
    return this.wallet.requestPayout(req.userId!, dto);
  }
}

/** Traitement des demandes de retrait par l'équipe OBP. */
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GESTIONNAIRE_LIQUIDITE, Role.ADMIN)
export class PayoutsController {
  constructor(
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@Query('status') status?: string) {
    const parsed = status && status in PayoutStatus ? (status as PayoutStatus) : undefined;
    return this.wallet.listPayouts(parsed);
  }

  @Post(':id/paid')
  async paid(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: PayoutPaidDto) {
    const r = await this.wallet.markPaid(id, req.userId!, dto.reference);
    await this.audit.log(req, 'Retrait vendeur payé', `${r.owner.fullName} · ${r.amount} F`, `vers ${r.phone} · réf. ${dto.reference}`);
    return r;
  }

  @Post(':id/reject')
  async reject(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: PayoutRejectDto) {
    const r = await this.wallet.reject(id, req.userId!, dto.reason);
    await this.audit.log(req, 'Retrait vendeur refusé', `${r.owner.fullName} · ${r.amount} F`, dto.reason);
    return r;
  }
}
