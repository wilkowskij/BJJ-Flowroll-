import { Injectable, ConflictException } from '@nestjs/common';
import { CheckInMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

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
}
