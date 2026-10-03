import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateVendorListingDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  /** Data URI (docs/decisions/0005-vendeurs-v1.md). Au moins 2 photos, VEN-04 — vérifié ici, pas seulement dans le formulaire. */
  @IsArray()
  @ArrayMinSize(2, { message: 'Ajoutez au moins 2 photos.' })
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos!: string[];
}
