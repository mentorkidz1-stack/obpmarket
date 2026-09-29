import { IsInt, IsString, Min } from 'class-validator';

export class CreateResaleListingDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
