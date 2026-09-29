import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { FulfillmentMode } from '@prisma/client';

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
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];
}
