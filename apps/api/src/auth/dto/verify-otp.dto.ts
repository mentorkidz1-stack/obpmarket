import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numéro de téléphone invalide.' })
  phone!: string;

  @IsString()
  @Length(6, 6, { message: 'Le code fait 6 chiffres.' })
  code!: string;
}
