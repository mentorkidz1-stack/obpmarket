import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le taux de TVA ne peut pas être négatif.' })
  @Max(100, { message: 'Le taux de TVA ne peut pas dépasser 100 %.' })
  vatRate?: number;

  @IsOptional()
  @IsIn(['TTC', 'HT'], { message: "L'affichage par défaut est « TTC » ou « HT »." })
  vatDefaultDisplay?: 'TTC' | 'HT';

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'La majoration ne peut pas être négative.' })
  @Max(100, { message: 'La majoration ne peut pas dépasser 100 %.' })
  markupPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3650)
  storageFreeDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100, { message: 'Les frais de stockage ne peuvent pas dépasser 100 %.' })
  storageFeePct?: number;

  @IsOptional()
  @IsBoolean()
  storageFeeMonthly?: boolean;
}
