import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { BeltLevel } from '@prisma/client';

export class UpdateBeltDto {
  @IsEnum(BeltLevel)
  beltLevel: BeltLevel;

  @IsString()
  @IsNotEmpty()
  promotedBy: string;
}
