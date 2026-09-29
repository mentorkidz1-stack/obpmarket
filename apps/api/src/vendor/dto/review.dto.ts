import { IsOptional, IsString } from 'class-validator';

export class ReviewDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
