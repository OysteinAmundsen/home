import { Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';

@Component({
  selector: 'lib-snackbar',
  template: `
    <!-- Always visible anchor element -->
    <div #anchor class="snackbar-anchor"></div>

    <!-- Popover content using native Popover API -->
    <div #popover class="snackbar-popover" popover="manual" role="alert" aria-live="polite">
      <div class="snackbar-content">
        <span class="snackbar-message">{{ message() }}</span>
        <button type="button" class="snackbar-close" (click)="close()" aria-label="Close notification">
          {{ action() }}
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .snackbar-anchor {
      width: 1px;
      height: 1px;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .snackbar-popover {
      /* Let the Popover API handle z-index and backdrop behavior */
      min-width: 300px;
      max-width: 600px;
      background: var(--snackbar-bg, #323232);
      color: var(--snackbar-color, white);
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      margin: 0;
      padding: 0;

      /* Position at bottom center */
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100%);

      /* Smooth transitions for show/hide */
      transition:
        opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        overlay 0.3s allow-discrete,
        display 0.3s allow-discrete;

      /* Starting state (hidden) */
      opacity: 0;
    }

    .snackbar-popover:popover-open {
      /* Ending state (visible) */
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .snackbar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      gap: 12px;
    }

    .snackbar-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }

    .snackbar-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.8;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .snackbar-close:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }

    .snackbar-close:focus {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }
  `,
})
export class SnackbarComponent implements OnDestroy {
  private readonly popover =
    viewChild.required<ElementRef<HTMLElement & { showPopover: () => void; hidePopover: () => void }>>('popover');

  protected readonly message = signal('');
  protected readonly action = signal('Close');

  private hideTimeout?: number;

  show(message: string, action = 'Close', options: { duration: number } = { duration: 3000 }): void {
    this.clearTimeout();
    this.message.set(message);
    this.action.set(action);

    // Use native Popover API
    const popoverElement = this.popover().nativeElement;
    popoverElement.showPopover();

    // Auto-hide after duration
    if (options.duration > 0) {
      this.hideTimeout = window.setTimeout(() => this.close(), options.duration);
    }
  }

  close(): void {
    const popoverElement = this.popover().nativeElement;
    popoverElement.hidePopover();
    this.clearTimeout();
  }

  private clearTimeout(): void {
    if (this.hideTimeout) {
      window.clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }
}
