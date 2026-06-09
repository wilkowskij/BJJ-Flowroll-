import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from './subscription.service';

const TIER_PRICES: Record<'starter' | 'growth' | 'pro', number> = {
  starter: 4,
  growth: 5,
  pro: 6,
};

function determineTier(studentCount: number): 'starter' | 'growth' | 'pro' {
  if (studentCount <= 50) return 'starter';
  if (studentCount <= 150) return 'growth';
  return 'pro';
}

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
      gyms.map((gym) => this.snapshotAndBillGym(gym.id)),
    );

    this.logger.log(`Billing snapshot complete for ${gyms.length} gyms`);
  }

  private async snapshotAndBillGym(gymId: string): Promise<void> {
    // 1. Update snapshot in DB
    await this.subscriptionService.snapshotBillingForGym(gymId);

    // 2. Retrieve subscription record
    const sub = await this.subscriptionService.getSubscription(gymId);
    if (!sub?.stripeCustomerId) {
      this.logger.warn(`Gym ${gymId} has no Stripe customer — skipping billing`);
      return;
    }

    // 3. Count active students and determine tier
    const activeStudents = await this.subscriptionService.getActiveStudentCount(gymId);
    if (activeStudents === 0) {
      this.logger.log(`Gym ${gymId} has 0 active students — skipping invoice`);
      return;
    }

    const tier = determineTier(activeStudents);
    const pricePerStudent = TIER_PRICES[tier];
    const totalAmount = activeStudents * pricePerStudent * 100; // Stripe uses cents

    const stripe = this.subscriptionService.getStripeInstance();

    try {
      // 4. Create a one-off invoice item for this gym's monthly usage
      await stripe.invoiceItems.create({
        customer: sub.stripeCustomerId,
        amount: totalAmount,
        currency: 'usd',
        description: `FlowMat ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan — ${activeStudents} active students × $${pricePerStudent}/mo`,
        metadata: {
          gymId,
          tier,
          activeStudents: String(activeStudents),
          pricePerStudent: String(pricePerStudent),
        },
      });

      // 5. Finalize and auto-advance the invoice
      const invoice = await stripe.invoices.create({
        customer: sub.stripeCustomerId,
        auto_advance: true,
        collection_method: 'charge_automatically',
        description: `FlowMat Monthly Billing — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        metadata: { gymId },
      });

      await stripe.invoices.finalizeInvoice(invoice.id);

      this.logger.log(
        `Invoice created and finalized for gym ${gymId}: ${invoice.id} — $${totalAmount / 100} (${activeStudents} students, ${tier})`,
      );
    } catch (err) {
      this.logger.error(`Failed to create Stripe invoice for gym ${gymId}`, err);
      throw err;
    }
  }
}
