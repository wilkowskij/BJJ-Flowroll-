import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(gymId: string, instructorId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: { gymId, instructorId, title: dto.title, body: dto.body },
    });

    // Push to all active students in gym (fire-and-forget)
    this.prisma.user
      .findMany({
        where: { gymId, isActive: true, firebaseToken: { not: null } },
        select: { firebaseToken: true },
      })
      .then((users) => {
        const tokens = users.map((u) => u.firebaseToken as string).filter(Boolean);
        if (tokens.length > 0) {
          return this.notifications.sendMulticastNotification(
            tokens,
            dto.title,
            dto.body,
            { type: 'announcement', announcementId: announcement.id },
          );
        }
      })
      .catch(() => {/* best-effort */});

    return announcement;
  }

  async findAll(gymId: string) {
    return this.prisma.announcement.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async remove(id: string, gymId: string) {
    return this.prisma.announcement.deleteMany({ where: { id, gymId } });
  }
}
