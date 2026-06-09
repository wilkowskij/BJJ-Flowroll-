import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  starter: 50,
  growth: 150,
  pro: 300,
  franchise: Infinity,
};

const TIER_PRICES: Record<'starter' | 'growth' | 'pro', number> = {
  starter: 4,
  growth: 5,
  pro: 6,
};

export interface BillingStatus {
  tier: 'starter' | 'growth' | 'pro';
  activeStudents: number;
  pricePerStudent: number;
  estimatedMonthlyBill: number;
  nextInvoiceDate: string;
  stripeSubscriptionId: string | null;
}

export function determineTier(studentCount: number): 'starter' | 'growth' | 'pro' {
  if (studentCount <= 50) return 'starter';
  if (studentCount <= 150) return 'growth';
  return 'pro';
}

/** Alias exported for unit testing — identical to determineTier. */
export const getTierForStudentCount = determineTier;

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  }

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

  async createStripeCustomer(
    gymId: string,
    email: string,
    gymName: string,
  ): Promise<{ stripeCustomerId: string }> {
    const existing = await this.getSubscription(gymId);
    if (existing?.stripeCustomerId) {
      return { stripeCustomerId: existing.stripeCustomerId };
    }

    const customer = await this.stripe.customers.create({
      email,
      name: gymName,
      metadata: { gymId },
    });

    await this.prisma.subscription.upsert({
      where: { gymId },
      update: { stripeCustomerId: customer.id },
      create: { gymId, stripeCustomerId: customer.id },
    });

    return { stripeCustomerId: customer.id };
  }

  /**
   * Creates a SetupIntent to collect a payment method for the gym.
   * FlowMat uses metered billing (monthly invoice items) so no recurring price is attached.
   * The subscriptionId returned is the SetupIntent id for tracking.
   */
  async createSubscription(
    gymId: string,
  ): Promise<{ subscriptionId: string; clientSecret: string }> {
    const sub = await this.getSubscription(gymId);
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException('Stripe customer not found. Call createStripeCustomer first.');
    }

    // Create a SetupIntent so the gym can save a payment method
    const setupIntent = await this.stripe.setupIntents.create({
      customer: sub.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { gymId },
    });

    // Record the setupIntent id as the "subscriptionId" for tracking purposes
    await this.prisma.subscription.update({
      where: { gymId },
      data: { stripeSubscriptionId: setupIntent.id },
    });

    return {
      subscriptionId: setupIntent.id,
      clientSecret: setupIntent.client_secret ?? '',
    };
  }

  async getPortalUrl(gymId: string): Promise<{ url: string }> {
    const sub = await this.getSubscription(gymId);
    if (!sub?.stripeCustomerId) {
      throw new NotFoundException('No billing account found for this gym.');
    }

    const appBaseUrl =
      this.configService.get<string>('APP_BASE_URL') ?? 'http://localhost:5173';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appBaseUrl}/billing`,
    });

    return { url: session.url };
  }

  async getBillingStatus(gymId: string): Promise<BillingStatus> {
    const [sub, activeStudents] = await Promise.all([
      this.getSubscription(gymId),
      this.getActiveStudentCount(gymId),
    ]);

    const tier = determineTier(activeStudents);
    const pricePerStudent = TIER_PRICES[tier];
    const estimatedMonthlyBill = activeStudents * pricePerStudent;

    // Calculate next invoice date (1st of next month)
    const now = new Date();
    const nextInvoice = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      tier,
      activeStudents,
      pricePerStudent,
      estimatedMonthlyBill,
      nextInvoiceDate: nextInvoice.toISOString(),
      stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
    };
  }

  async cancelSubscription(gymId: string): Promise<void> {
    const sub = await this.getSubscription(gymId);
    if (!sub?.stripeCustomerId) {
      throw new NotFoundException('No active billing account found for this gym.');
    }

    await this.prisma.subscription.update({
      where: { gymId },
      data: {
        stripeSubscriptionId: null,
        billingPeriodEnd: new Date(),
      },
    });
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed', err);
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    this.logger.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const paidThrough = new Date(invoice.period_end * 1000);
          await this.prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { billingPeriodEnd: paidThrough, updatedAt: new Date() },
          });
          this.logger.log(
            `Updated paidThrough for customer ${customerId} to ${paidThrough.toISOString()}`,
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        this.logger.warn(`Payment failed for Stripe customer ${customerId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;
        if (customerId) {
          await this.prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              stripeSubscriptionId: null,
              billingPeriodEnd: new Date(),
              updatedAt: new Date(),
            },
          });
          this.logger.log(`Subscription cancelled for customer ${customerId}`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled Stripe webhook event type: ${event.type}`);
    }
  }

  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
