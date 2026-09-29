import { IsIn, IsString } from 'class-validator';
import { VendorType } from '@prisma/client';

export class CreateVendorProfileDto {
  @IsIn([VendorType.PARTICULIER, VendorType.PROFESSIONNEL, VendorType.COOPERATIVE])
  type!: VendorType;

  @IsString()
  zone!: string;

  @IsString()
  paymentInfo!: string;
}
