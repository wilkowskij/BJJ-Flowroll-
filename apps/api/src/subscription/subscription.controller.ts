import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '../auth/auth.guard';
import { GymContext } from '../auth/gym-context.decorator';

@Controller('api/v1/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  @UseGuards(AuthGuard)
  async getBillingStatus(@GymContext() gymId: string) {
    return this.subscriptionService.getBillingStatus(gymId);
  }

  @Post('create')
  @UseGuards(AuthGuard)
  async createSubscription(@GymContext() gymId: string) {
    return this.subscriptionService.createSubscription(gymId);
  }

  @Get('portal')
  @UseGuards(AuthGuard)
  async getPortalUrl(@GymContext() gymId: string, @Res() res: Response) {
    const { url } = await this.subscriptionService.getPortalUrl(gymId);
    return res.redirect(url);
  }

  @Post('stripe-webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.subscriptionService.handleWebhookEvent(rawBody, signature);
    return { received: true };
  }
}
