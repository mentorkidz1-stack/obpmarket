import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator';

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(2, 120) name?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() @Length(2, 60) unitLabel?: string;
  @IsOptional() @IsBoolean() isPerishable?: boolean;
  @IsOptional() @IsBoolean() isStockable?: boolean;
  /** Taux de TVA du produit en % : 0 = exonéré, null = taux par défaut des réglages. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number | null;
}

/** Réapprovisionnement ou correction du stock au magasin : un nouveau total, avec le motif. */
export class AdjustStockDto {
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsString()
  @Length(3, 200, { message: 'Indiquez le motif (3 caractères minimum).' })
  reason!: string;
}

export class UpdateCategoryDto {
  @IsString()
  @Length(2, 60)
  name!: string;
}
