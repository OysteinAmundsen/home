import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Service that provides information about the "visibility" of the document.
 *
 * That means that it will report `isBrowserActive() = true` if the document is in focus
 * and the browser tab is active.
 * The service exposes both a signal and an observable to allow for both reactive and
 * imperative usage.
 *
 * @example
 * ```ts
 * // Subscribe to changes
 * visibilityService.browserActive$.subscribe(isActive => console.log(`SUBCRIPTION: ${isActive}`));
 *
 * // Ask for the current state
 * console.log(`MANUAL CHECK: ${visibilityService.isBrowserActive()}`);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class VisibilityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  // In SSR environment, the window object does not exist. We need to get a mockup window object from the globalThis object.
  // from angulars DOCUMENT object.
  private window = globalThis.window || this.document.defaultView;

  // Is true if current document is active and in focus
  private isTabActive = signal(this.isDocumentActive());
  /** Readonly flag set to true if the browser tab is active and in focus */
  isBrowserActive = computed(() => this.isTabActive());
  browserActive$ = toObservable(this.isBrowserActive);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyVisibilityChangeHandler();
    }
  }

  ngOnDestroy(): void {
    // Cleanup window state event listeners
    this.window.removeEventListener('focus', this.updateTabState.bind(this));
    this.window.removeEventListener('blur', this.updateTabState.bind(this));
    this.document.removeEventListener('visibilitychange', this.updateTabState.bind(this));
  }

  /* Event handler for document visibility and focus state changes */
  private applyVisibilityChangeHandler() {
    this.window.addEventListener('focus', this.updateTabState.bind(this), { passive: true });
    this.window.addEventListener('blur', this.updateTabState.bind(this), { passive: true });
    this.document.addEventListener('visibilitychange', this.updateTabState.bind(this), { passive: true });
  }

  private updateTabState() {
    this.isTabActive.set(this.isDocumentActive());
  }

  // Abstraction for checking document state
  private isDocumentActive() {
    return !this.document.hidden && 'hasFocus' in this.document && this.document.hasFocus();
  }
}
