import { Injectable } from '@nestjs/common';
import { PushSubscription, sendNotification, setVapidDetails } from 'web-push';

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

  async notifyClient(subscription: PushSubscription, payload: any) {
    // Send the notification to the client
    const res = await sendNotification(subscription, JSON.stringify(payload), {});
  }
}
