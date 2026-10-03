import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class DeliveryStatusDto {
  /** Étape suivante : la commande est prête, ou le livreur est parti. La remise finale passe par `deliver`. */
  @IsIn([DeliveryStatus.PREPAREE, DeliveryStatus.EN_ROUTE], { message: 'Statut invalide : choisissez « préparée » ou « en route ».' })
  status!: DeliveryStatus;
}

export class DeliverDto {
  /** Code à 6 chiffres donné par le client à la réception (obligatoire sauf pour un administrateur). */
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Le code de livraison contient 6 chiffres.' })
  code?: string;
}
