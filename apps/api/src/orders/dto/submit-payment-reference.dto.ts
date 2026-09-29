import { IsIn, IsString, MinLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/** Déclaration du client après envoi manuel via son appli Mobile Money — aucune API appelée. */
export class SubmitPaymentReferenceDto {
  @IsIn([PaymentMethod.MTN_MOMO, PaymentMethod.MOOV_MONEY])
  paymentMethod!: PaymentMethod;

  @IsString()
  @MinLength(3)
  paymentReference!: string;
}
