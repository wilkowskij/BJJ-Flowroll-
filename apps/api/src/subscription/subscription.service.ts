import { Injectable } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  starter: 30,
  growth: 100,
  pro: 300,
  franchise: Infinity,
};

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveStudentCount(gymId: string): Promise<number> {
    return this.prisma.user.count({
      where: { gymId, isActive: true, deletedAt: null },
    });
  }

  async getSubscription(gymId: string) {
    return this.prisma.subscription.findUnique({ where: { gymId } });
  }

  async getCurrentTier(gymId: string): Promise<SubscriptionTier> {
    const sub = await this.getSubscription(gymId);
    return sub?.tier ?? SubscriptionTier.starter;
  }

  async isWithinTierLimit(gymId: string): Promise<boolean> {
    const [count, tier] = await Promise.all([
      this.getActiveStudentCount(gymId),
      this.getCurrentTier(gymId),
    ]);
    return count < TIER_LIMITS[tier];
  }

  async snapshotBillingForGym(gymId: string): Promise<void> {
    const activeStudentCount = await this.getActiveStudentCount(gymId);
    await this.prisma.subscription.upsert({
      where: { gymId },
      update: {
        activeStudentCount,
        billingPeriodStart: new Date(),
        updatedAt: new Date(),
      },
      create: {
        gymId,
        activeStudentCount,
        billingPeriodStart: new Date(),
      },
    });
  }
}
