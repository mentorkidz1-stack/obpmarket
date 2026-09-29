import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Min } from 'class-validator';

export class CreateMarketDto {
  @IsString()
  name!: string;

  @IsString()
  city!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  radiusMeters?: number;
}
