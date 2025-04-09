import { objToString } from '@home/shared/utils/object';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription, sendNotification, SendResult, setVapidDetails } from 'web-push';
import { NotificationContent } from './notification.model';
import { Subscription } from './subscription.entity';

@Injectable()
export class NotificationService {
  private PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  private PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  private VAPID = process.env.VAPID;

  clients: PushSubscription[] = [];

  constructor(@InjectRepository(Subscription) private subscriptionRepository: Repository<Subscription>) {
    if (!this.PUBLIC_KEY || !this.PRIVATE_KEY || !this.VAPID) {
      Logger.error(`
        VAPID keys are not set. Please add:
          "VAPID",
          "VAPID_PUBLIC_KEY" and
          "VAPID_PRIVATE_KEY"
        to your environment variables.`);
    } else {
      setVapidDetails(this.VAPID, this.PUBLIC_KEY, this.PRIVATE_KEY);
    }
  }

  getPublicKey() {
    return this.PUBLIC_KEY;
  }

  async addSubscriptionClient(subscription: PushSubscription) {
    // Save the subscription to the database
    return await this.subscriptionRepository.save({ subscriptionObject: objToString(subscription) } as Subscription);
  }

  async removeSubscriptionClient(subscription: PushSubscription): Promise<boolean> {
    // Remove the subscription from the database
    const sub = await this.subscriptionRepository.findOneBy({
      subscriptionObject: objToString(subscription),
    } as Subscription);
    if (sub) {
      const entity = await this.subscriptionRepository.remove(sub);
      return true;
    }
    return false;
  }

  async notifyClient(subscription: PushSubscription, payload: NotificationContent): Promise<SendResult> {
    // Send the notification to the client
    return await sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: {
        subject: `${this.VAPID}`,
        publicKey: `${this.PUBLIC_KEY}`,
        privateKey: `${this.PRIVATE_KEY}`,
      },
    });
  }
}
