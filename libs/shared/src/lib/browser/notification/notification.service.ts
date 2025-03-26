import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { urlBase64ToUint8Array } from '../../utils/object';
import { SERVICE_WORKER } from '../service-worker/service-worker';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly platformId = inject(PLATFORM_ID);

  private async getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return undefined;

    // Setup notification
    return await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
  }

  async canSubscribe(): Promise<boolean> {
    return (await this.getRegistration()) != null;
  }

  async hasSubscription(): Promise<boolean> {
    const reg = await this.getRegistration();
    if (!reg) return false;

    // Check if we already have a subscription
    return !!(await reg.pushManager.getSubscription());
  }

  /**
   * Subscribes to the notification service
   *
   * @returns the subscription object if successful
   */
  async subscribe(): Promise<PushSubscription | undefined> {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return undefined;

    // Setup notification
    const reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
    if (!reg) throw new Error('Service worker not registered');

    // Check if we already have a subscription
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const { publicKey } = await fetch('/api/notification/vapid').then((res) => res.json());
      const convertedKey = urlBase64ToUint8Array(publicKey);
      // This will ask for user permission and create a subscription
      subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedKey });
      if (subscription) {
        // User accepted. Save the subscription to the server
        const res = await fetch('/api/notification/register', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        }).then((res) => res.json());
      }
    }
    return subscription || undefined;
  }

  /**
   * Unsubscribe from the notification service.
   *
   * This will also remove the subscription object from the server
   * as a new one will have to be created when subscribing again.
   *
   * @returns true if the unsubscription was successful
   */
  async unsubscribe(): Promise<boolean> {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return false;

    const reg = await this.getRegistration();
    if (!reg) throw new Error('Service worker not registered');

    // Check if we already have a subscription
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const res = await fetch('/api/notification/unregister', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      }).then((res) => res.json());
      return await subscription.unsubscribe();
    }
    return true;
  }
}
