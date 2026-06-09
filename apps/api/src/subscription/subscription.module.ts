import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { BillingSnapshotCron } from './billing-snapshot.cron';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, BillingSnapshotCron],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
