import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { urlBase64ToUint8Array } from '../../utils/object';
import { SERVICE_WORKER } from '../service-worker/service-worker';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly platformId = inject(PLATFORM_ID);

  async canSubscribe() {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return false;

    // Setup notification
    const reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
    return reg != null;
  }

  async hasSubscription() {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return false;

    // Setup notification
    const reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
    if (!reg) {
      return false;
    }

    // Check if we already have a subscription
    return !!(await reg.pushManager.getSubscription());
  }

  /**
   * Subscribes to the notification service
   *
   *
   * @returns
   */
  async subscribe() {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return;

    // Setup notification
    const reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
    if (!reg) {
      throw new Error('Service worker not registered');
    }

    // Check if we already have a subscription
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const { publicKey } = await fetch('/api/notification/vapid').then((res) => res.json());
      const convertedKey = urlBase64ToUint8Array(publicKey);
      // This will ask for user permission
      subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedKey });
    }
    // TODO: Do not send the subscription object if a previous subscription exists, when
    // we have a backend to store the subscription
    fetch('/api/notification/register', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    return subscription;
  }

  async unsubscribe(): Promise<boolean> {
    // Should not run in SSR
    if (isPlatformServer(this.platformId)) return false;

    // Setup notification
    const reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
    if (!reg) {
      throw new Error('Service worker not registered');
    }

    // Check if we already have a subscription
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const res = await fetch('/api/notification/unregister', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      return subscription.unsubscribe();
    }
    return true;
  }
}
