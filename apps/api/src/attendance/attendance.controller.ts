import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CheckInDto } from './dto/check-in.dto';

@Controller('api/v1/attendance')
@UseGuards(AuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.attendanceService.findAll(user.gymId);
  }

  @Post()
  checkIn(@Body() dto: CheckInDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.attendanceService.checkIn(user.supabaseUid, user.gymId, dto);
  }
}
