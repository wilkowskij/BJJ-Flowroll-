import { IsString, IsNotEmpty } from 'class-validator';

export class QrCheckinDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
