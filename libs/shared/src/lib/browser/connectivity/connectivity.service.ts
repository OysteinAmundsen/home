import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Service to check the connectivity status of the browser.
 *
 * This will expose a `isBrowserOffline` flag as a signal and observable
 * which will be set to true if the browser looses connectivity.
 *
 * We expose both a signal and an observable to allow for both reactive and
 * imperative usage.
 *
 * @example
 * ```ts
 * // Subscribe to changes
 * connectivityService.isBrowserOffline$.subscribe(isOffline => console.log(`SUBCRIPTION: ${isOffline}`));
 *
 * // Ask for the current state
 * console.log(`MANUAL CHECK: ${connectivityService.isBrowserOffline()}`);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  // prettier-ignore
  private readonly document = (() => { try { return inject(DOCUMENT); } catch { return document; } })();
  // In SSR environment, the window object does not exist. We need to get a mockup window object from the globalThis object.
  // from angulars DOCUMENT object.
  private window = globalThis.window || this.document.defaultView;
  //Appear online if ssr rendered. This is to avoid the flickering of the offline gradient.
  private isOffline = signal(typeof window === 'undefined' ? false : !navigator.onLine);
  /** Readonly flag set to true if browser looses connectivity */
  isBrowserOffline = computed(() => this.isOffline());
  isBrowserOffline$ = toObservable(this.isBrowserOffline);

  constructor() {
    this.applyConnectivityChangeHandler();
  }

  /* Cleanup event listeners */
  ngOnDestroy(): void {
    // Cleanup connectivity event listeners
    this.window.removeEventListener('online', () => this.updateConnectivityState.bind(this));
    this.window.removeEventListener('offline', () => this.updateConnectivityState.bind(this));
  }

  /* Apply event listeners */
  private applyConnectivityChangeHandler() {
    this.window.addEventListener('online', this.updateConnectivityState.bind(this), { passive: true });
    this.window.addEventListener('offline', this.updateConnectivityState.bind(this), { passive: true });
  }

  /* Event handler for connectivity state changes */
  private updateConnectivityState() {
    // Do not ask for geolocation in SSR
    if (typeof window === 'undefined') return;
    this.isOffline.set(!navigator.onLine);
  }
}
