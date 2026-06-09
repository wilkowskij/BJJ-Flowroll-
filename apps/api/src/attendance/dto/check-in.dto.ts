import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { CheckInMethod } from '@prisma/client';

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsEnum(CheckInMethod)
  @IsOptional()
  checkInMethod?: CheckInMethod;

  @IsString()
  @IsOptional()
  qrToken?: string;
}
