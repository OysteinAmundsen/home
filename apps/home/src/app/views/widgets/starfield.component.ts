import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AppSettingsService } from '../../app.settings';
import { ThemeService } from '../../shared/theme/theme.service';
import { toHsl } from '../../shared/utils/color';
import { VisibilityService } from '../../shared/visibility/visibility.service';
import { AbstractWidgetComponent } from '../../shared/widget/abstract-widget.component';
import { WidgetComponent } from '../../shared/widget/widget.component';

/**
 * A widget that displays a starfield animation
 */
@Component({
  selector: 'app-widget-starfield',
  imports: [WidgetComponent],
  template: `
    <app-widget [host]="host()">
      <canvas #starfield [width]="width()" [height]="height()"></canvas>
    </app-widget>
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly visibility = inject(VisibilityService);
  private readonly settings = inject(AppSettingsService);

  id = signal('starfield');

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('starfield');
  canvasEl = computed(() => this.canvas()?.nativeElement);
  ctx = computed(() => isPlatformBrowser(this.platformId) && this.canvasEl()?.getContext('2d'));
  rect = linkedSignal<DOMRect>(() => this.getDOMRect());
  width = computed(() => this.rect()?.width ?? 0);
  height = computed(() => this.rect()?.height ?? 0);
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

  resized$ = new BehaviorSubject<DOMRect | undefined>(undefined);
  observer: any;
  _oldRect = '';
  onRectChange = effect(() => {
    const rect = JSON.stringify(this.rect());
    if (rect != this._oldRect) {
      this._oldRect = rect;
    }
  });

  animationFrame: number | undefined;

  ngAfterViewInit() {
    if (this.canvas() == null) return;

    // Resize handler
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new ResizeObserver((changes) => this.resized$.next(changes[0].contentRect));
      this.observer.observe(this.canvasEl()!);
      this.resized$.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200)).subscribe((rect) => {
        this.rect.set(rect as DOMRect);
        for (const star of this.stars()) {
          star.canvasChanged();
        }
      });
    }

    // Setup canvas
    // const maxStars = 1;
    const maxStars = this.isFullscreen() ? 1000 : 200;

    // Initialize stars
    if (isPlatformBrowser(this.platformId)) {
      const stars = [];
      for (let i = 0; i < maxStars; i++) {
        stars.push(new Star(this.canvasEl()!, this.isFullscreen()));
      }
      this.stars.set(stars);
    }

    this.theme.selectedTheme$
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200), distinctUntilChanged())
      .subscribe(() => this.color.set(this.computedColor()));

    // Initialize
    if (this.settings.pauseOnInactive()) {
      this.visibility.browserActive$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((active) => {
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

  private computedColor() {
    const tmp = this.doc.createElement('div');
    tmp.style.cssText = 'color: var(--color-text)';
    this.doc.body.appendChild(tmp);
    const window = globalThis.window || this.doc.defaultView;
    const currentColor = window.getComputedStyle(tmp).color;
    this.doc.body.removeChild(tmp);
    return currentColor;
  }

  private getDOMRect() {
    if (
      isPlatformBrowser(this.platformId) &&
      this.el.nativeElement != null &&
      'getBoundingClientRect' in this.el.nativeElement
    ) {
      return this.el.nativeElement.getBoundingClientRect();
    }
    return { width: 0, height: 0 } as DOMRect;
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
    if (this.observer) this.observer.disconnect();
  }
}

type Point = {
  x: number;
  y: number;
};

type Arc = {
  x: number;
  y: number;
  radius: number;
};

// Star object
class Star {
  // Canvas and sizes
  canvas = signal<HTMLCanvasElement | undefined>(undefined);
  ctx = computed<CanvasRenderingContext2D | undefined>(() => this.canvas()?.getContext('2d') || undefined);
  rect = linkedSignal<DOMRect>(() => this.canvas()?.getBoundingClientRect() || ({ width: 0, height: 0 } as DOMRect));
  center = computed<Point>(() => ({
    x: this.rect().width / 2,
    y: this.rect().height / 2,
  }));

  // Colors
  currentColor = signal('#fff');
  hslColor = linkedSignal(() => toHsl(this.currentColor()));
  _lastColor = '';
  color = computed(() => {
    // Triggers
    const z = this.z();
    const [h, s, l] = this.hslColor();
    const width = this.rect().width;

    // Calculation
    const percent = (z * 100) / width;
    const invPercent = 100 - percent;
    let lPercent;
    const alphaPercent = invPercent;
    if (l > 50) {
      // Current color lightness is more than 50%, we are seeing white stars
      lPercent = invPercent;
    } else {
      // Current color lightness is less than 50%, we are seeing black stars
      lPercent = percent;
    }
    return `hsl(${h}deg, ${s / 2}%, ${lPercent}%, ${alphaPercent}%)`;
  });
  _lastHalfColor = '';
  halfColor = computed(() => {
    const [h, s, l] = this.hslColor();
    return `hsl(${h}deg, ${s / 2}%, ${l}%, 50%)`;
  });
  large = false;

  // Position and movement
  startPos = signal<Point>({ x: 0, y: 0 });
  curPos = computed(() => {
    const z = this.z();
    const { x, y } = this.startPos();
    const { width, height } = this.rect();
    return {
      x: this.remap(x / z, 0, 1, 0, width),
      y: this.remap(y / z, 0, 1, 0, height),
    };
  });
  z = signal(0);
  size = 0;
  speed = 0;
  angle = 0;
  radius = computed(() => {
    const z = this.z();
    const { width } = this.rect();
    return this.remap(z, 0, width, this.size, 0);
  });

  arcs: Arc[] = [];
  retainPositions = 3;

  constructor(canvas: HTMLCanvasElement, large = false) {
    this.canvas.set(canvas);
    this.large = large;
    if (this.large) this.retainPositions = 5;

    // Initialize
    this.reset();
  }

  canvasChanged() {
    this.arcs = [];
    this.rect.set(
      (this.canvas()?.getBoundingClientRect() || {
        width: 0,
        height: 0,
      }) as DOMRect,
    );
  }

  setCurrentColor(color: string) {
    this.currentColor.set(color);
  }

  reset() {
    const { x, y } = this.center();
    // this.startPos.set({ x: -x + 100, y: -y + 100 });
    this.startPos.set({
      x: this.random(-x, x),
      y: this.random(-y, y),
    });
    const { width } = this.rect();
    const [h, s, l] = toHsl(this.currentColor());
    const variation = 100;
    this.hslColor.set([this.random(h - variation, h + variation), this.random(s - variation, s + variation), l]);

    this.size = this.random(1, this.large ? 6 : 2);
    this.speed = this.random(1, 5);
    this.angle = this.random(0, width) * 2 * Math.PI;
    this.z.set(Math.abs(this.random(width / ((this.size + this.speed) * 3), width)));
    if (this.remap(this.z(), 0, width, this.size, 0) < 0) {
      this.z.set(width);
    }
    this.arcs = [];
  }

  draw() {
    this.z.update((z) => (z -= this.speed));
    const z = this.z();
    const ctx = this.ctx()!;

    const arc = this.arcs[0];
    const center = this.center();
    const r = this.radius();

    if (z <= 0 || Math.abs(arc?.x) >= center.x || Math.abs(arc?.y) >= center.y || r < 0) {
      // Star is off screen, reset
      this.reset();
      return;
    }

    const { x, y } = this.curPos();
    const color = this.color();
    const alpha = this.halfColor();
    this.arcs.push({ x, y, radius: r });
    if (this.arcs.length > this.retainPositions) {
      this.arcs.shift();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (this._lastColor !== color) {
      ctx.fillStyle = color;
      this._lastColor = color;
    }
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(this.arcs[0].x, this.arcs[0].y);
    if (this._lastHalfColor !== alpha) {
      ctx.strokeStyle = alpha;
      this._lastHalfColor = alpha;
    }
    ctx.stroke();
    ctx.closePath();
  }

  random(min: number, max: number): number {
    return Math.random() * (max - min + 1) + min;
  }

  remap(value: number, istart: number, istop: number, ostart: number, ostop: number): number {
    const deltaI = istop - istart;
    const deltaO = ostop - ostart;
    return ostart + deltaO * ((value - istart) / deltaI);
  }
}
