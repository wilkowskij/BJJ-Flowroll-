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
}
