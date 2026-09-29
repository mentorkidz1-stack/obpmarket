import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
