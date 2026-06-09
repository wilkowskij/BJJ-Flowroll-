import { IsString, IsNotEmpty } from 'class-validator';

export class ManualCheckinDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;
}
