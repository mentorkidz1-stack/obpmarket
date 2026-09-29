import { IsNumber, IsPositive } from 'class-validator';

export class OfferLiquidityDto {
  @IsNumber()
  @IsPositive()
  unitPrice!: number;
}
