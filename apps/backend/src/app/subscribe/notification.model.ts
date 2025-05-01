import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export type NotificationContentType = 'notification' | 'warning' | 'info';

export interface NotificationContent {
  title: string;
  body: string;
  type: NotificationContentType;
  tag?: string;
}

@ApiSchema({ name: 'PublicKeyResponse' })
export class PublicKeyResponse {
  @ApiProperty({ description: 'The VAPID public key', type: 'string' })
  publicKey!: string;
}

@ApiSchema({ name: 'PushSubscriptionKeys' })
export class PushSubscriptionKeys {
  @ApiProperty({ description: 'The p256dh key', type: 'string' })
  p256dh!: string;

  @ApiProperty({ description: 'The auth key', type: 'string' })
  auth!: string;
}
@ApiSchema({ name: 'PushSubscriptionRequest' })
export class PushSubscriptionRequest implements Partial<PushSubscription> {
  @ApiProperty({ description: 'The endpoint for the subscription', type: 'string' })
  endpoint!: string;

  @ApiProperty({ description: 'The expiration time for the subscription', type: 'number' })
  expirationTime!: number | null;

  @ApiProperty({ description: 'The keys for the subscription', type: PushSubscriptionKeys })
  keys!: PushSubscriptionKeys;
}
