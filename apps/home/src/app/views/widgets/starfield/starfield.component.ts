import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AppSettingsService } from '../../../app.settings';
import { ResizeDirective } from '@home/shared/browser/resize/resize.directive';
import { ThemeService } from '@home/shared/browser/theme/theme.service';
import { VisibilityService } from '@home/shared/browser/visibility/visibility.service';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { Star } from './star';

/**
 * A widget that displays a starfield animation
 */
@Component({
  selector: 'app-widget-starfield',
  imports: [WidgetComponent, ResizeDirective],
  template: `
    <lib-widget [host]="host()">
      <canvas #starfield [libResize]="'auto'" (resized)="onResize($event)"></canvas>
    </lib-widget>
  `,
  styles: [
    `
      canvas {
        display: block;
        min-width: 300px;
        width: 100%;
        height: 100%;
        transition:
          opacity 0.3s,
          filter 0.3s;
      }
    `,
  ],
})
export default class StarFieldComponent extends AbstractWidgetComponent implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly theme = inject(ThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly visibility = inject(VisibilityService);
  private readonly settings = inject(AppSettingsService);

  id = signal('starfield');

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('starfield');
  canvasEl = computed(() => this.canvas()?.nativeElement);
  ctx = computed(() => isPlatformBrowser(this.platformId) && this.canvasEl()?.getContext('2d'));

  // Size
  rect = signal<DOMRect>({ width: 0, height: 0 } as DOMRect);
  width = computed(() => this.rect().width);
  height = computed(() => this.rect().height);

  color = signal('#fff');
  stars = signal([] as Star[]);
  onThemeChange = effect(() => {
    // Triggers
    const color = this.color();
    const stars = this.stars();

    // Action
    if (stars.length === 0) return;
    for (const star of stars) {
      star.setCurrentColor(color);
    }
  });

  animationFrame: number | undefined;

  ngAfterViewInit() {
    if (this.canvas() == null) return;

    // Setup canvas
    // const maxStars = 1;
    const maxStars = this.isFullscreen() ? 1000 : 200;

    // Initialize stars
    if (isPlatformBrowser(this.platformId)) {
      const stars = [];
      for (let i = 0; i < maxStars; i++) {
        stars.push(new Star(this.canvasEl, this.isFullscreen()));
      }
      this.stars.set(stars);
    }

    this.theme.selectedTheme$
      .pipe(takeUntilDestroyed(this.destroyRef$), debounceTime(200), distinctUntilChanged())
      .subscribe(() => this.color.set(this.computedColor()));

    // Initialize
    if (this.settings.pauseOnInactive()) {
      this.visibility.browserActive$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((active) => {
        if (active) {
          this.animate();
        } else {
          this.pause();
        }
      });
    } else {
      this.animate();
    }
  }

  onResize(size: DOMRect) {
    this.rect.set(size);
    for (const star of this.stars()) {
      star.canvasChanged();
    }
  }

  private computedColor() {
    const tmp = this.doc.createElement('div');
    tmp.style.cssText = 'color: var(--color-text)';
    this.doc.body.appendChild(tmp);
    const window = globalThis.window || this.doc.defaultView;
    const currentColor = window.getComputedStyle(tmp).color;
    this.doc.body.removeChild(tmp);
    return currentColor;
  }

  // Animation loop
  animate() {
    // Update canvas size
    const width = this.width();
    const height = this.height();
    const stars = this.stars();
    if (width > 1 && stars.length > 0) {
      const centerX = width / 2;
      const centerY = height / 2;
      const ctx = this.ctx()!;

      // Clear
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.translate(centerX, centerY);

        for (const star of stars) {
          star.draw();
        }
        ctx.translate(-centerX, -centerY);
      }
    }
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  pause() {
    // If browser tab is inactive, pause the animation
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

    // Draw the pause state
    const width = this.width();
    const height = this.height();
    const centerX = width / 2;
    const centerY = height / 2;
    const ctx = this.ctx()!;
    const color = this.color();
    const stars = this.stars();

    if (width > 1 && stars.length > 0 && ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.translate(centerX, centerY);
      for (const star of stars) {
        try {
          star.setCurrentColor(color);
          star.draw();
        } catch (e) {
          console.error(e);
        }
      }

      ctx.font = '16px Arial';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('Interstellar travel paused', 0, 0);
      ctx.translate(-centerX, -centerY);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }
}
