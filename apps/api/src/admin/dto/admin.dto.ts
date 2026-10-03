import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

const TEAM = [Role.AGENT, Role.AGENT_MAGASIN, Role.GESTIONNAIRE_PRIX, Role.GESTIONNAIRE_LIQUIDITE, Role.MODERATEUR, Role.ADMIN];

export class CreateStaffDto {
  @IsString() @Length(2, 100) fullName!: string;
  @IsString() @Length(8, 30) phone!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsEnum(Role) role!: Role;
  /** Facultatif : sinon un mot de passe provisoire est généré et affiché une seule fois. */
  @IsOptional() @IsString() @MinLength(10, { message: 'Le mot de passe doit contenir au moins 10 caractères.' }) password?: string;
}

export class UpdateStaffDto {
  @IsOptional() @IsString() @Length(2, 100) fullName?: string;
  @IsOptional() @IsString() @Length(8, 30) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() disabled?: boolean;
}

export class DisableDto {
  @IsBoolean() disabled!: boolean;
}

export const TEAM_ROLE_LIST = TEAM;
