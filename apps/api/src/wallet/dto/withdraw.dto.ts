import { IsEnum, IsNumber, IsPositive, IsString, Length } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(PaymentMethod, { message: 'Choisissez MTN MoMo ou Moov Money.' })
  method!: PaymentMethod;

  /** Numéro Mobile Money qui recevra les fonds. */
  @IsString()
  @Length(8, 20, { message: 'Indiquez un numéro Mobile Money valide.' })
  phone!: string;
}

export class PayoutPaidDto {
  @IsString()
  @Length(3, 80, { message: 'Indiquez la référence du versement (3 caractères minimum).' })
  reference!: string;
}

export class PayoutRejectDto {
  @IsString()
  @Length(3, 300, { message: 'Indiquez le motif du refus.' })
  reason!: string;
}
