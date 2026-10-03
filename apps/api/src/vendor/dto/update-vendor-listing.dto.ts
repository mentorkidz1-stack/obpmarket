import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

/** Correction d'une annonce par son vendeur (annonce en attente ou à corriger). */
export class UpdateVendorListingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos?: string[];
}

export class MarkReceivedDto {
  /** Quantité réellement reçue au magasin (par défaut : la quantité annoncée). */
  @IsOptional()
  @IsInt()
  @Min(1)
  receivedQuantity?: number;

  /** Dépôt OBP qui a reçu la marchandise (obligatoire dès qu'au moins un dépôt est ouvert). */
  @IsOptional()
  @IsString()
  depotId?: string;
}

export class UpdateVendorProfileDto {
  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  paymentInfo?: string;
}
