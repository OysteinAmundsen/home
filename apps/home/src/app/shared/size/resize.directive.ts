import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  output,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime } from 'rxjs';

/**
 * A directive that listens to changes in the size of an element.
 *
 * It uses `ResizeObserver` and emits a `resized` event every time the size changes.
 * If set to `auto`, it will also automatically set the width and height attributes
 * of the host element.
 *
 * @example
 * ```html
 * <div appResize="auto" (resized)="onResize($event)"></div>
 * ```
 */
@Directive({
  selector: '[appResize]',
})
export class ResizeDirective implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly host = inject(ElementRef);

  /**
   * Configuration for the resize directive.
   * - `auto`: Automatically resize the host element
   * - `none`: Do not resize the host element
   *
   * Default: `none`
   *
   * In any case, the `resized` event will be emitted so you can do
   * whatever you want with the new size.
   */
  config = input('none', {
    alias: 'appResize',
    transform: (value: string | undefined) => (value != null && value != '' && value === 'auto' ? 'auto' : 'none'),
  });
  resized = output<DOMRect>();

  rect = linkedSignal<DOMRect>(() => this.getDOMRect());
  resized$ = new BehaviorSubject<DOMRect | undefined>(undefined);
  observer: any;
  _oldRect = '';

  // Responsible for emitting the resize event
  onRectChange = effect(() => {
    const rect = this.rect();
    if (!rect) return;
    const rectStr = JSON.stringify(rect);
    if (rectStr != this._oldRect) {
      this._oldRect = rectStr;
      this.resized.emit(rect);

      if (this.config() === 'auto') {
        // Apply the new size to the host element
        this.host.nativeElement.setAttribute('width', `${rect.width}`);
        this.host.nativeElement.setAttribute('height', `${rect.height}`);
      }
    }
  });

  private getDOMRect() {
    if (
      isPlatformBrowser(this.platformId) &&
      this.host.nativeElement != null &&
      'getBoundingClientRect' in this.host.nativeElement
    ) {
      return this.host.nativeElement.getBoundingClientRect();
    }
    return { width: 0, height: 0 } as DOMRect;
  }

  ngAfterViewInit(): void {
    // Resize handler
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new ResizeObserver((changes) => {
        this.resized$.next(changes[0].contentRect);
      });
      this.observer.observe(this.host.nativeElement);
      this.resized$.pipe(takeUntilDestroyed(this.destroyRef$), debounceTime(200)).subscribe((rect) => {
        this.rect.set(rect as DOMRect);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
