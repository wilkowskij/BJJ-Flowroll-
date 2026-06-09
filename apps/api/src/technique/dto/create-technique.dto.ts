import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { BeltLevel, TechniquePosition, TechniqueType } from '@prisma/client';

export class CreateTechniqueDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TechniquePosition)
  position: TechniquePosition;

  @IsEnum(BeltLevel)
  beltLevel: BeltLevel;

  @IsEnum(TechniqueType)
  type: TechniqueType;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;
}
