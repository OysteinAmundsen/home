import { Injectable } from '@nestjs/common';
import { PushSubscription, sendNotification, SendResult, setVapidDetails } from 'web-push';
import { NotificationContent } from './notification.model';

@Injectable()
export class NotificationService {
  private PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  private PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  private VAPID = process.env.VAPID;

  clients: PushSubscription[] = [];

  constructor() {
    if (!this.PUBLIC_KEY || !this.PRIVATE_KEY || !this.VAPID) {
      throw new Error(`
        VAPID keys are not set. Please add:
          "VAPID",
          "VAPID_PUBLIC_KEY" and
          "VAPID_PRIVATE_KEY"
        to your environment variables.`);
    }
    setVapidDetails(this.VAPID, this.PUBLIC_KEY, this.PRIVATE_KEY);
  }

  getPublicKey() {
    return this.PUBLIC_KEY;
  }

  addSubscriptionClient(subscription: PushSubscription) {
    // Save the subscription to the database
    this.clients.push(subscription);
  }

  removeSubscriptionClient(subscription: PushSubscription) {
    // Remove the subscription from the database
    this.clients = this.clients.filter((client) => client !== subscription);
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
