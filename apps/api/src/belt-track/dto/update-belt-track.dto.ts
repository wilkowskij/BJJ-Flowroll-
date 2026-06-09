import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateBeltTrackDto {
  @IsArray()
  @IsOptional()
  requiredTechniqueIds?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  requiredClasses?: number;

  @IsOptional()
  unlockCriteria?: Record<string, any>;
}
