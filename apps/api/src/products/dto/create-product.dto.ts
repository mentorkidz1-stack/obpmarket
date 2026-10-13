import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  categoryId!: string;

  /** Unité de référence — RG-02 (ex. "sac 100 kg", "bidon 20 L"). */
  @IsString()
  unitLabel!: string;

  @IsOptional()
  @IsBoolean()
  isPerishable?: boolean;

  @IsOptional()
  @IsBoolean()
  isStockable?: boolean;

  /** Taux de TVA du produit en % : 0 = exonéré ; absent = taux par défaut des réglages. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
}
