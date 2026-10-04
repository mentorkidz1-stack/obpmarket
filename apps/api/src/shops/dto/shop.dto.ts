import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @Length(3, 60, { message: 'Le nom de la boutique contient entre 3 et 60 caractères.' })
  shopName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 600, { message: 'La présentation ne peut pas dépasser 600 caractères.' })
  shopDescription?: string;

  /** Numéro WhatsApp affiché sur la vitrine, indicatif compris (ex. 22997000000). Vide pour ne pas l'afficher. */
  @IsOptional()
  @Matches(/^(\d{8,15})?$/, { message: 'Le numéro WhatsApp doit contenir 8 à 15 chiffres, avec l\'indicatif (ex. 22997000000).' })
  shopWhatsapp?: string;

  @IsOptional()
  @IsBoolean()
  shopPublished?: boolean;
}

export class ShopEventDto {
  @IsString()
  @IsIn(['VUE', 'PARTAGE', 'CONTACT'], { message: 'Événement inconnu.' })
  kind!: 'VUE' | 'PARTAGE' | 'CONTACT';
}
