import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckInMethod } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';
import { QrTokenDto } from './dto/qr-token.dto';
import { QrCheckinDto } from './dto/qr-checkin.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';

interface QrTokenPayload {
  classId: string;
  gymId: string;
  type: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkIn(userId: string, gymId: string, dto: CheckInDto) {
    const existing = await this.prisma.attendance.findUnique({
      where: { userId_classId: { userId, classId: dto.classId } },
    });

    if (existing) {
      throw new ConflictException('Already checked in to this class');
    }

    return this.prisma.attendance.create({
      data: {
        userId,
        gymId,
        classId: dto.classId,
        checkInMethod: dto.checkInMethod ?? CheckInMethod.manual,
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.attendance.findMany({
      where: { gymId },
      include: {
        user: { select: { id: true, name: true, email: true, beltLevel: true } },
        class: { select: { id: true, title: true, startTime: true } },
      },
      orderBy: { checkedInAt: 'desc' },
    });
  }

  async generateQrToken(gymId: string, instructorId: string, dto: QrTokenDto) {
    // Verify the class belongs to this gym
    const classSchedule = await this.prisma.classSchedule.findFirst({
      where: { id: dto.classId, gymId },
    });

    if (!classSchedule) {
      throw new NotFoundException('Class not found');
    }

    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new BadRequestException('JWT secret not configured');
    }

    const token = jwt.sign(
      { classId: dto.classId, gymId, type: 'qr-checkin' },
      secret,
      { expiresIn: '4h' },
    );

    const qrValue = `flowmat://checkin?token=${token}`;

    return { token, qrValue };
  }

  async qrCheckin(userId: string, gymId: string, dto: QrCheckinDto) {
    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new BadRequestException('JWT secret not configured');
    }

    let payload: QrTokenPayload;
    try {
      payload = jwt.verify(dto.token, secret) as QrTokenPayload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired QR token');
    }

    if (payload.type !== 'qr-checkin') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.gymId !== gymId) {
      throw new ForbiddenException('QR code is for a different gym');
    }

    // Verify class belongs to the gym
    const classSchedule = await this.prisma.classSchedule.findFirst({
      where: { id: payload.classId, gymId },
    });

    if (!classSchedule) {
      throw new NotFoundException('Class not found');
    }

    // Prevent double check-in for same user + class today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingToday = await this.prisma.attendance.findFirst({
      where: {
        userId,
        classId: payload.classId,
        checkedInAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingToday) {
      throw new ConflictException('Already checked in to this class today');
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        gymId,
        classId: payload.classId,
        checkInMethod: CheckInMethod.qr,
        checkedInAt: new Date(),
      },
    });

    return {
      success: true,
      className: classSchedule.title,
      checkedInAt: attendance.checkedInAt.toISOString(),
    };
  }

  async manualCheckin(instructorGymId: string, dto: ManualCheckinDto) {
    // Verify the student belongs to this gym
    const student = await this.prisma.user.findFirst({
      where: { id: dto.studentId, gymId: instructorGymId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify the class belongs to this gym
    const classSchedule = await this.prisma.classSchedule.findFirst({
      where: { id: dto.classId, gymId: instructorGymId },
    });

    if (!classSchedule) {
      throw new NotFoundException('Class not found');
    }

    const existing = await this.prisma.attendance.findUnique({
      where: { userId_classId: { userId: dto.studentId, classId: dto.classId } },
    });

    if (existing) {
      throw new ConflictException('Student already checked in to this class');
    }

    return this.prisma.attendance.create({
      data: {
        userId: dto.studentId,
        gymId: instructorGymId,
        classId: dto.classId,
        checkInMethod: CheckInMethod.manual,
        checkedInAt: new Date(),
      },
    });
  }

  async getSchedule(gymId: string) {
    return this.prisma.classSchedule.findMany({
      where: { gymId },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        rrule: true,
        instructorId: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
