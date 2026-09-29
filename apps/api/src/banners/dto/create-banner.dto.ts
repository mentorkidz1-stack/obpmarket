import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  imageUrl!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
