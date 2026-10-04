import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { DeliveryMode, FulfillmentMode } from '@prisma/client';

class OrderItemInput {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  /** CMD-02. Par défaut RETRAIT ; DEPOT exige un produit stockable non périssable (RG-06). */
  @IsOptional()
  @IsIn([FulfillmentMode.RETRAIT, FulfillmentMode.DEPOT])
  fulfillment?: FulfillmentMode;

  /** Achat depuis la vitrine d'un vendeur : son annonce est servie en priorité, au même prix de référence. */
  @IsOptional()
  @IsString()
  vendorListingId?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];

  /** Retrait au dépôt (par défaut) ou livraison à domicile assurée par OBP. Ne concerne que les produits « retrait ». */
  @IsOptional()
  @IsIn([DeliveryMode.RETRAIT, DeliveryMode.LIVRAISON])
  deliveryMode?: DeliveryMode;

  /** Zone de livraison (obligatoire en livraison) : ses frais s'ajoutent au total de la commande. */
  @IsOptional()
  @IsString()
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  @Length(5, 250, { message: "Indiquez l'adresse de livraison (quartier, rue, repère)." })
  deliveryAddress?: string;

  /** Numéro joignable le jour de la livraison (par défaut : celui du compte). */
  @IsOptional()
  @IsString()
  @Length(8, 20)
  deliveryPhone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 250)
  deliveryNote?: string;

  /** Dépôt où retirer la commande (retrait) ; en livraison, le dépôt de la zone est utilisé. */
  @IsOptional()
  @IsString()
  depotId?: string;
}
