import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGamePlanDto } from './dto/upsert-game-plan.dto';

@Injectable()
export class GamePlanService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUserId(supabaseUid: string, gymId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { supabaseUid, gymId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.id;
  }

  async getGamePlan(supabaseUid: string, gymId: string) {
    const userId = await this.resolveUserId(supabaseUid, gymId);

    const gamePlan = await this.prisma.gamePlan.findUnique({
      where: { userId_gymId: { userId, gymId } },
    });

    if (!gamePlan) {
      return { positions: {} };
    }

    return gamePlan;
  }

  async upsertGamePlan(supabaseUid: string, gymId: string, dto: UpsertGamePlanDto) {
    const userId = await this.resolveUserId(supabaseUid, gymId);

    return this.prisma.gamePlan.upsert({
      where: { userId_gymId: { userId, gymId } },
      update: {
        positions: dto.positions,
      },
      create: {
        userId,
        gymId,
        positions: dto.positions,
      },
    });
  }
}
