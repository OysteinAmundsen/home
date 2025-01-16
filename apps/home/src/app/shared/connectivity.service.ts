import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';

/**
 * Service to check the connectivity status of the browser.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  // In SSR environment, the window object does not exist. We need to get a mockup window object from the globalThis object.
  // from angulars DOCUMENT object.
  private window = globalThis.window || this.document.defaultView;
  private isOffline = signal(
    typeof window === 'undefined' || !navigator.onLine,
  );
  /** Readonly flag set to true if browser looses connectivity */
  public isBrowserOffline = computed(() => this.isOffline());

  constructor() {
    this.applyConnectivityChangeHandler();
  }

  /* Cleanup event listeners */
  ngOnDestroy(): void {
    // Cleanup connectivity event listeners
    this.window.removeEventListener('online', () =>
      this.updateConnectivityState.bind(this),
    );
    this.window.removeEventListener('offline', () =>
      this.updateConnectivityState.bind(this),
    );
  }

  /* Apply event listeners */
  private applyConnectivityChangeHandler() {
    this.window.addEventListener(
      'online',
      this.updateConnectivityState.bind(this),
    );
    this.window.addEventListener(
      'offline',
      this.updateConnectivityState.bind(this),
    );
  }

  /* Event handler for connectivity state changes */
  private updateConnectivityState() {
    // Do not ask for geolocation in SSR
    if (typeof window === 'undefined') return;
    this.isOffline.set(!navigator.onLine);
  }
}
