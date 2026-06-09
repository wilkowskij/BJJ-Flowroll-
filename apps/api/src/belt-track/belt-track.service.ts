import { Injectable, NotFoundException } from '@nestjs/common';
import { BeltLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBeltTrackDto } from './dto/update-belt-track.dto';

@Injectable()
export class BeltTrackService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(gymId: string, beltLevel: BeltLevel) {
    const track = await this.prisma.beltTrack.findUnique({
      where: { gymId_beltLevel: { gymId, beltLevel } },
    });
    if (!track) throw new NotFoundException(`BeltTrack for ${beltLevel} not found`);
    return track;
  }

  async upsert(gymId: string, beltLevel: BeltLevel, dto: UpdateBeltTrackDto) {
    return this.prisma.beltTrack.upsert({
      where: { gymId_beltLevel: { gymId, beltLevel } },
      update: {
        ...(dto.requiredTechniqueIds !== undefined && { requiredTechniqueIds: dto.requiredTechniqueIds }),
        ...(dto.requiredClasses !== undefined && { requiredClasses: dto.requiredClasses }),
        ...(dto.unlockCriteria !== undefined && { unlockCriteria: dto.unlockCriteria }),
      },
      create: {
        gymId,
        beltLevel,
        requiredTechniqueIds: dto.requiredTechniqueIds ?? [],
        requiredClasses: dto.requiredClasses ?? 0,
        unlockCriteria: dto.unlockCriteria,
      },
    });
  }

  async getStudentProgress(gymId: string, supabaseUid: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseUid } });
    if (!user) return null;

    const beltOrder: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black'];
    const currentIdx = beltOrder.indexOf(user.beltLevel);
    const nextBelt: BeltLevel = beltOrder[currentIdx + 1] ?? 'black';

    const track = await this.prisma.beltTrack.findUnique({
      where: { gymId_beltLevel: { gymId, beltLevel: nextBelt } },
    });

    const loggedRows = await this.prisma.techniqueLog.findMany({
      where: { userId: user.id },
      select: { techniqueId: true },
      distinct: ['techniqueId'],
    });

    const attendedCount = await this.prisma.attendance.count({
      where: { userId: user.id },
    });

    return {
      currentBelt: user.beltLevel,
      nextBelt,
      requiredTechniques: (track?.requiredTechniqueIds as string[]) ?? [],
      loggedTechniqueIds: loggedRows
        .map((l) => l.techniqueId)
        .filter((id): id is string => id !== null),
      requiredClasses: track?.requiredClasses ?? 0,
      attendedClasses: attendedCount,
    };
  }
}
