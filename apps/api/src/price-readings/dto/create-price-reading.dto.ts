import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsPositive, IsString, IsUrl } from 'class-validator';

export class CreatePriceReadingDto {
  @IsString()
  productId!: string;

  @IsString()
  marketId!: string;

  @IsString()
  agentId!: string;

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
