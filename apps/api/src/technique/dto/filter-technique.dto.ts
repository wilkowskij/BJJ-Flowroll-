import { IsOptional, IsEnum } from 'class-validator';
import { BeltLevel, TechniquePosition, TechniqueType } from '@prisma/client';

export class FilterTechniqueDto {
  @IsOptional()
  @IsEnum(TechniquePosition)
  position?: TechniquePosition;

  @IsOptional()
  @IsEnum(BeltLevel)
  beltLevel?: BeltLevel;

  @IsOptional()
  @IsEnum(TechniqueType)
  type?: TechniqueType;
}
