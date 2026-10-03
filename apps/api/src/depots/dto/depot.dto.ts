import { IsBoolean, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateDepotDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsString()
  @Length(2, 80)
  city!: string;

  @IsString()
  @Length(3, 200)
  address!: string;

  @IsOptional()
  @IsString()
  @Length(6, 25)
  phone?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

export class UpdateDepotDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(3, 200)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(6, 25)
  phone?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateZoneDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsNumber()
  @Min(0)
  fee!: number;

  @IsOptional()
  @IsString()
  depotId?: string;
}

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsString()
  depotId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
