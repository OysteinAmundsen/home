import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

/**
 * The controller for the /api/notification route.
 *
 * This is the controller used to handle the notification subscription.
 *
 * @param server
 */
@Controller('api/notification')
export class NotificationController {
  constructor(private notification: NotificationService) {}

  @Get('vapid')
  publicKey() {
    return { publicKey: this.notification.getPublicKey() };
  }

  @Post('register')
  async subscribe(@Body() subscription: any) {
    await this.notification.addSubscriptionClient(subscription);
    setTimeout(
      () =>
        this.notification.notifyClient(subscription, {
          title: 'Welcome',
          body: 'You are now subscribed to notifications',
        }),
      1000,
    );
    return { success: true };
  }
}
