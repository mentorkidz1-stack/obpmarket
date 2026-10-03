import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsPositive, IsString, IsUrl } from 'class-validator';

export class CreatePriceReadingDto {
  @IsString()
  productId!: string;

  @IsString()
  marketId!: string;

  /** Ignoré : l'agent est celui du jeton de connexion. Conservé pour ne pas casser les anciens clients. */
  @IsOptional()
  @IsString()
  agentId?: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsString()
  quality?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
