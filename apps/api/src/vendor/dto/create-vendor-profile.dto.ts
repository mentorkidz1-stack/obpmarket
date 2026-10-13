import { IsIn, IsString, Length } from 'class-validator';
import { VendorType } from '@prisma/client';

export class CreateVendorProfileDto {
  @IsIn([VendorType.PARTICULIER, VendorType.PROFESSIONNEL, VendorType.COOPERATIVE])
  type!: VendorType;

  @IsString()
  zone!: string;

  @IsString()
  paymentInfo!: string;

  /** Jeton du lien d'invitation reçu d'OBP Market : il n'y a pas d'inscription libre. */
  @IsString()
  @Length(10, 80, { message: "Le compte vendeur s'ouvre sur invitation : utilisez le lien envoyé par OBP Market." })
  inviteToken!: string;
}
