import { Controller, Get } from '@nestjs/common';

/**
 * Numéros marchands Mobile Money affichés au client pour un envoi manuel — aucune
 * API ni agrégateur, voir docs/decisions/0007-paiement-momo-manuel.md.
 */
@Controller('payment-info')
export class PaymentInfoController {
  @Get()
  get() {
    return {
      merchantName: process.env.MOMO_MERCHANT_NAME ?? 'OBP Market',
      mtnNumber: process.env.MOMO_MTN_NUMBER ?? '',
      moovNumber: process.env.MOMO_MOOV_NUMBER ?? '',
    };
  }
}
