import { ArrayMaxSize, IsArray, IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateVendorListingDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  /** Data URI (docs/decisions/0005-vendeurs-v1.md). Au moins 2 recommandées, VEN-04. */
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos!: string[];
}
