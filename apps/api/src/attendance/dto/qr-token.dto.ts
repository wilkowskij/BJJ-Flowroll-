import { IsString, IsNotEmpty } from 'class-validator';

export class QrTokenDto {
  @IsString()
  @IsNotEmpty()
  classId: string;
}
