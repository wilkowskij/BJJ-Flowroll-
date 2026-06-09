import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { CheckInDto } from './dto/check-in.dto';
import { QrTokenDto } from './dto/qr-token.dto';
import { QrCheckinDto } from './dto/qr-checkin.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';

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

  @Post('qr-token')
  generateQrToken(@Body() dto: QrTokenDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    if (user.role !== 'instructor' && user.role !== 'admin' &&
        user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only instructors and admins can generate QR tokens');
    }
    return this.attendanceService.generateQrToken(user.gymId, user.supabaseUid, dto);
  }

  @Post('qr-checkin')
  qrCheckin(@Body() dto: QrCheckinDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.attendanceService.qrCheckin(user.supabaseUid, user.gymId, dto);
  }

  @Post('manual')
  manualCheckin(@Body() dto: ManualCheckinDto, @Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    if (user.role !== 'instructor' && user.role !== 'admin' &&
        user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only instructors and admins can manually check in students');
    }
    return this.attendanceService.manualCheckin(user.gymId, dto);
  }

  @Get('schedule')
  getSchedule(@Req() req: Request) {
    const user = (req as any).user as AuthenticatedUser;
    return this.attendanceService.getSchedule(user.gymId);
  }
}
