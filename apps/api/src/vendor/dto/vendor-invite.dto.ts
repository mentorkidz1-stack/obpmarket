import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { VendorType } from '@prisma/client';

export class CreateVendorInviteDto {
  /** Mémo interne : pour qui, dans quel cadre (l'invité ne le voit pas). */
  @IsString()
  @Length(2, 120, { message: 'Indiquez pour qui est cette invitation (2 caractères minimum).' })
  note!: string;

  /** Si renseigné, seul ce numéro de téléphone pourra utiliser l'invitation (format international, ex. +22997000000). */
  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @IsOptional()
  @IsIn([VendorType.PARTICULIER, VendorType.PROFESSIONNEL, VendorType.COOPERATIVE])
  type?: VendorType;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  zone?: string;

  /** Durée de validité du lien, en jours (14 par défaut). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  validDays?: number;
}
