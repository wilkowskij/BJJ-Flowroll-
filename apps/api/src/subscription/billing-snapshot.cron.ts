import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class BillingSnapshotCron {
  private readonly logger = new Logger(BillingSnapshotCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlySnapshot(): Promise<void> {
    this.logger.log('Running monthly billing snapshot...');

    const gyms = await this.prisma.gym.findMany({
      select: { id: true },
    });

    await Promise.allSettled(
      gyms.map((gym) => this.subscriptionService.snapshotBillingForGym(gym.id)),
    );

    this.logger.log(`Billing snapshot complete for ${gyms.length} gyms`);
  }
}
