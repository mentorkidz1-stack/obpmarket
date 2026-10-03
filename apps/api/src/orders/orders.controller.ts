import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { IsString, Length } from 'class-validator';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { SubmitPaymentReferenceDto } from './dto/submit-payment-reference.dto.js';
import { RejectPaymentDto } from './dto/reject-payment.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

class WithdrawDto {
  @IsString()
  @Length(6, 6, { message: 'Le bon de retrait contient 6 chiffres.' })
  code!: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.userId!, dto);
  }

  @Get('mine')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.orders.findMine(req.userId!);
  }

  /** Back-office : paiements déclarés par les clients, en attente de vérification manuelle. */
  @Get('payment-queue')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE)
  findPendingPayments() {
    return this.orders.findPendingPayments();
  }

  /** Back-office : toutes les commandes (recherche par n°, nom ou téléphone ; filtre par statut). */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE)
  adminAll(@Query('status') status?: OrderStatus, @Query('q') q?: string, @Query('take') take?: string, @Query('skip') skip?: string) {
    return this.orders.findAllForAdmin({ status, q, take: take ? Number(take) : undefined, skip: skip ? Number(skip) : undefined });
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE)
  adminOne(@Param('id') id: string) {
    return this.orders.findOneForAdmin(id);
  }

  /** Magasin : vérifier un bon de retrait avant de remettre la marchandise. */
  @Get('withdrawal/:code')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE, Role.AGENT_MAGASIN)
  previewWithdrawal(@Param('code') code: string) {
    return this.orders.previewWithdrawal(code);
  }

  /** Magasin : marchandise remise, le bon est consommé. */
  @Post('withdraw')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE, Role.AGENT_MAGASIN)
  withdraw(@Req() req: AuthenticatedRequest, @Body() dto: WithdrawDto) {
    return this.orders.withdraw(dto.code, req);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orders.findOneForClient(req.userId!, id);
  }

  /** Crée une session de paiement Nyole et renvoie l'URL vers laquelle rediriger le client. */
  @Post(':id/pay-online')
  payOnline(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orders.createNyoleSession(req.userId!, id);
  }

  /** Filet de sécurité si le webhook Nyole n'est jamais arrivé — vérifie le statut directement. */
  @Post(':id/reconcile-payment')
  reconcilePayment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orders.reconcileNyoleSession(req.userId!, id);
  }

  /** Flux de secours : le client déclare avoir envoyé l'argent et indique la référence reçue par SMS. */
  @Post(':id/submit-payment-reference')
  submitPaymentReference(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitPaymentReferenceDto,
  ) {
    return this.orders.submitPaymentReference(req.userId!, id, dto);
  }

  /** Back-office : le gestionnaire confirme avoir retrouvé le dépôt sur son compte Mobile Money. */
  @Post(':id/confirm-payment')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE)
  confirmPayment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orders.confirmPayment(req.userId!, id);
  }

  /** Back-office : référence introuvable ou invalide, la commande est annulée. */
  @Post(':id/reject-payment')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GESTIONNAIRE_LIQUIDITE)
  rejectPayment(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: RejectPaymentDto) {
    return this.orders.rejectPayment(req.userId!, id, dto.reason);
  }
}
