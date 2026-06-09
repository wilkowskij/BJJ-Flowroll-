import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { BeltLevel } from '@prisma/client';

export class CreateWeeklyPostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsOptional()
  techniqueIds?: string[];

  @IsEnum(BeltLevel)
  @IsOptional()
  beltTarget?: BeltLevel;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
