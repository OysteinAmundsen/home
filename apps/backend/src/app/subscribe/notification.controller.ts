import { Body, Controller, forwardRef, Get, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicKeyResponse, PushSubscriptionRequest } from './notification.model';
import { NotificationService } from './notification.service';

/**
 * The controller for the /api/notification route.
 *
 * This is the controller used to handle the notification subscription.
 * You must register your [VAPID](https://vapidkeys.com/) keys to use
 * this service.
 *
 * @param server
 */
@ApiTags('notification')
@Controller('api/notification')
export class NotificationController {
  constructor(@Inject(forwardRef(() => NotificationService)) private notification: NotificationService) {}

  @Get('vapid')
  @ApiOperation({ summary: 'Get VAPID public key' })
  @ApiOkResponse({ description: 'Servers VAPID public key.', type: PublicKeyResponse })
  publicKey(): PublicKeyResponse {
    return { publicKey: this.notification.getPublicKey() } as PublicKeyResponse;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register for notifications' })
  @ApiBody({ description: 'Push subscription request', type: PushSubscriptionRequest })
  @ApiOkResponse({ description: 'Success flag' })
  async subscribe(@Body() subscription: PushSubscriptionRequest) {
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
  @ApiOperation({ summary: 'Unregister from notifications' })
  @ApiBody({ description: 'Push subscription request', type: PushSubscriptionRequest })
  @ApiOkResponse({ description: 'Success flag' })
  async unsubscribe(@Body() subscription: PushSubscriptionRequest) {
    await this.notification.removeSubscriptionClient(subscription);
    return { success: true };
  }
}
