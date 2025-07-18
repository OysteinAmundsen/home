import { isPlatformBrowser } from '@angular/common';
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
import { AppSettingsService } from '@home/shared/app.settings';
import { logMsg } from '@home/shared/browser/logger/logger';
import { ResizeDirective } from '@home/shared/browser/resize/resize.directive';
import { ThemeService } from '@home/shared/browser/theme/theme.service';
import { VisibilityService } from '@home/shared/browser/visibility/visibility.service';
import { getComputedStyle } from '@home/shared/utils/color';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Star } from './star';

/**
 * A widget that displays a starfield animation
 */
@Component({
  selector: 'lib-widget-starfield',
  imports: [WidgetComponent, ResizeDirective],
  templateUrl: './starfield.component.html',
  styleUrl: './starfield.component.scss',
})
export default class StarFieldComponent extends AbstractWidgetComponent implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly theme = inject(ThemeService);
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
  isPaused = computed(() => {
    const isActive = this.visibility.isBrowserActive();
    const shouldPause = this.settings.pauseOnInactive();
    return shouldPause && !isActive;
  });

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
      .subscribe(() => this.color.set(getComputedStyle(this.el.nativeElement, '--color-text')));

    // Initialize
    this.visibility.browserActive$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((active) => {
      if (active && !this.animationFrame) {
        this.animate();
      } else if (this.isPaused()) {
        this.pause();
      }
    });
    this.animate();
  }

  onResize(size: DOMRect) {
    this.rect.set(size);
    for (const star of this.stars()) {
      star.canvasChanged();
    }
  }

  // Animation loop
  animate() {
    // Update canvas size
    if (this.isPaused()) return;

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
    if (isPlatformBrowser(this.platformId)) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  pause() {
    // If browser tab is inactive, pause the animation
    this.cancelAnimationFrame();

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
          console.error(...logMsg('error', 'Starfield', e));
        }
      }

      ctx.font = '16px Roboto';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('Interstellar travel paused', 0, 0);
      ctx.translate(-centerX, -centerY);
    }
  }

  private cancelAnimationFrame() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  ngOnDestroy(): void {
    this.cancelAnimationFrame();
  }
}
