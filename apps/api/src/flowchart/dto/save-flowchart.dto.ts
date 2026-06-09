import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class SaveFlowchartDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  nodes?: Record<string, any>[];

  @IsArray()
  @IsOptional()
  edges?: Record<string, any>[];

  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;
}
