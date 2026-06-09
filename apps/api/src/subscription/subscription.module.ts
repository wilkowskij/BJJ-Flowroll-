import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { BillingSnapshotCron } from './billing-snapshot.cron';

@Module({
  providers: [SubscriptionService, BillingSnapshotCron],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
