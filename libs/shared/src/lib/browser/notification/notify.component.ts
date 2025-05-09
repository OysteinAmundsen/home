import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { logMsg } from '../logger/logger';
import { NotificationService } from './notification.service';

@Component({
  selector: 'lib-notify',
  template: `
    @if (canSubscribe()) {
      <button type="button" class="flat text-shadow" (click)="toggleSub()" [title]="title()">
        <span class="material-symbols-outlined">
          {{ hasSubscription() ? 'notifications_active' : 'notifications_off' }}
        </span>
      </button>
    }
  `,
  host: {
    '[class.icon-button]': 'canSubscribe()',
  },
})
export class NotifyComponent implements OnInit {
  private readonly notification = inject(NotificationService);

  hasSubscription = signal(false);
  canSubscribe = signal(false);

  title = computed(() => {
    const hasSub = this.hasSubscription();
    return `Turn ${hasSub ? 'off' : 'on'} notifications`;
  });

  async ngOnInit() {
    try {
      this.canSubscribe.set(await this.notification.canSubscribe());
      this.hasSubscription.set(await this.notification.hasSubscription());
    } catch (e) {
      console.error(...logMsg('error', 'Notification', 'Failed to check subscription', e));
    }
  }

  async toggleSub() {
    if (this.hasSubscription()) {
      await this.unsubscribe();
    } else {
      await this.subscribe();
    }
  }

  async subscribe() {
    const sub = await this.notification.subscribe();
    if (sub) this.hasSubscription.set(true);
  }
  async unsubscribe() {
    const res = await this.notification.unsubscribe();
    if (res) this.hasSubscription.set(false);
  }
}
