import { Body, Controller, forwardRef, Get, Inject, Post } from '@nestjs/common';
import { PushSubscription } from 'web-push';
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
  constructor(@Inject(forwardRef(() => NotificationService)) private notification: NotificationService) {}

  @Get('vapid')
  publicKey() {
    return { publicKey: this.notification.getPublicKey() };
  }

  @Post('register')
  async subscribe(@Body() subscription: PushSubscription) {
    await this.notification.addSubscriptionClient(subscription);
    setTimeout(
      () =>
        this.notification.notifyClient(subscription, {
          title: 'Welcome',
          body: 'You are now subscribed to notifications',
          type: 'notification',
          tag: 'home-welcome',
        }),
      1000,
    );
    return { success: true };
  }

  @Post('unregister')
  async unsubscribe(@Body() subscription: PushSubscription) {
    await this.notification.removeSubscriptionClient(subscription);
    return { success: true };
  }
}
