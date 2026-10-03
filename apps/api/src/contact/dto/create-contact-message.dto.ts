import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsString()
  @Length(3, 120)
  subject!: string;

  @IsString()
  @Length(10, 2000)
  message!: string;

  /** Champ piège (invisible pour un humain) : rempli seulement par les robots. */
  @IsOptional()
  @IsString()
  website?: string;
}
