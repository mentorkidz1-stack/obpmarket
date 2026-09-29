import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdatePhotosDto {
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos!: string[];
}
