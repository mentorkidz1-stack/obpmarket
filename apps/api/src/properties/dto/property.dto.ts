import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export const PROPERTY_TYPES = ['PARCELLE', 'MAISON', 'APPARTEMENT', 'CHAMBRE', 'GUEST_HOUSE', 'LOCAL_COMMERCIAL', 'TERRAIN_AGRICOLE'] as const;
export const PROPERTY_KINDS = ['VENTE', 'LOCATION'] as const;
export const PROPERTY_STATUSES = ['DISPONIBLE', 'RESERVE', 'CONCLU'] as const;
export const AREA_UNITS = ['M2', 'ARE', 'HECTARE'] as const;
export const RENT_PERIODS = ['NUIT', 'MOIS', 'AN'] as const;

export class CreatePropertyDto {
  @IsString()
  @Length(3, 140)
  title!: string;

  @IsIn(PROPERTY_TYPES)
  type!: (typeof PROPERTY_TYPES)[number];

  @IsIn(PROPERTY_KINDS)
  kind!: (typeof PROPERTY_KINDS)[number];

  @IsOptional()
  @IsIn(PROPERTY_STATUSES)
  status?: (typeof PROPERTY_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @Length(2, 80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaValue?: number;

  @IsOptional()
  @IsIn(AREA_UNITS)
  areaUnit?: (typeof AREA_UNITS)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  titleDeed?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsIn(RENT_PERIODS)
  rentPeriod?: (typeof RENT_PERIODS)[number];

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  photos?: string[];
}

export class UpdatePropertyDto {
  @IsOptional() @IsString() @Length(3, 140) title?: string;
  @IsOptional() @IsIn(PROPERTY_TYPES) type?: (typeof PROPERTY_TYPES)[number];
  @IsOptional() @IsIn(PROPERTY_KINDS) kind?: (typeof PROPERTY_KINDS)[number];
  @IsOptional() @IsIn(PROPERTY_STATUSES) status?: (typeof PROPERTY_STATUSES)[number];
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @Length(2, 80) city?: string;
  @IsOptional() @IsString() @MaxLength(120) district?: string;
  @IsOptional() @IsNumber() @Min(0) areaValue?: number;
  @IsOptional() @IsIn(AREA_UNITS) areaUnit?: (typeof AREA_UNITS)[number];
  @IsOptional() @IsInt() @Min(0) bedrooms?: number;
  @IsOptional() @IsInt() @Min(0) bathrooms?: number;
  @IsOptional() @IsString() @MaxLength(300) titleDeed?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsIn(RENT_PERIODS) rentPeriod?: (typeof RENT_PERIODS)[number];
  @IsOptional() @IsBoolean() negotiable?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) photos?: string[];
}

export class CreateInquiryDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(8, 30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  /** Champ piège anti-robots. */
  @IsOptional()
  @IsString()
  website?: string;
}
