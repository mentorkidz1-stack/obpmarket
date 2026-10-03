import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateMarketDto {
  @IsOptional() @IsString() @Length(2, 80) name?: string;
  @IsOptional() @IsString() @Length(2, 80) city?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
  @IsOptional() @IsInt() @Min(50) radiusMeters?: number;
}
