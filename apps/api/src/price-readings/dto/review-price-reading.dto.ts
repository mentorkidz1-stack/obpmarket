import { IsOptional, IsString } from 'class-validator';

/** L'identifiant du gestionnaire vient du jeton (JwtAuthGuard), plus du corps de la requête. */
export class ReviewPriceReadingDto {
  @IsOptional()
  @IsString()
  note?: string;
}
