import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';

/**
 * Service that provides information about the "visibility" of the document.
 *
 * That means that it will report `isBrowserActive() = true` if the document is in focus
 * and the browser tab is active.
 */
@Injectable({ providedIn: 'root' })
export class VisibilityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  // In SSR environment, the window object does not exist. We need to get a mockup window object from the globalThis object.
  // from angulars DOCUMENT object.
  private window = globalThis.window || this.document.defaultView;

  // Is true if current document is active and in focus
  private isTabActive = signal(this.isDocumentActive());
  /** Readonly flag set to true if the browser tab is active and in focus */
  public isBrowserActive = computed(() => this.isTabActive());

  constructor() {
    this.applyVisibilityChangeHandler();
  }

  ngOnDestroy(): void {
    // Cleanup window state event listeners
    this.window.removeEventListener('focus', this.updateTabState.bind(this));
    this.window.removeEventListener('blur', this.updateTabState.bind(this));
    this.document.removeEventListener(
      'visibilitychange',
      this.updateTabState.bind(this),
    );
  }

  /* Event handler for document visibility and focus state changes */
  private applyVisibilityChangeHandler() {
    this.window.addEventListener('focus', this.updateTabState.bind(this));
    this.window.addEventListener('blur', this.updateTabState.bind(this));
    this.document.addEventListener(
      'visibilitychange',
      this.updateTabState.bind(this),
    );
  }

  private updateTabState() {
    this.isTabActive.set(this.isDocumentActive());
  }

  // Abstraction for checking document state
  private isDocumentActive() {
    return (
      !this.document.hidden &&
      'hasFocus' in this.document &&
      this.document.hasFocus()
    );
  }
}
