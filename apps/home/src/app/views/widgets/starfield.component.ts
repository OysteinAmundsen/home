import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ThemeService } from '../../shared/theme/theme.service';
import { toHsl } from '../../shared/utils/color';
import { VisibilityService } from '../../shared/visibility/visibility.service';
import { AbstractWidgetComponent } from '../../shared/widget/abstract-widget.component';

@Component({
  selector: 'app-widget-starfield',
  template: `
    <canvas #starfield [width]="width()" [height]="height()"></canvas>
  `,
  styles: [
    `
      :host {
        view-transition-class: 'widget';
        view-transition-name: starfield;
      }
      // Displayed in fullscreen
      :root:not(:has(app-widget)) :host {
        background: linear-gradient(
          to bottom,
          transparent,
          color-mix(in srgb, var(--background-color), transparent 10%) 40%
        );
        width: calc(100% + 2rem);
        height: calc(100% + 2rem);
        margin: -1rem;
        canvas {
          width: 100%;
          height: 100%;
          margin: 0;
        }
      }
      // Displayed in dashboard
      canvas {
        display: block;
        min-width: 300px;
        width: calc(100% + 2rem);
        height: calc(100% + 2rem);
        margin: -1rem;
        transition:
          opacity 0.3s,
          filter 0.3s;
      }
      :root .inactive :host canvas {
        // opacity: 0.3;
        // filter: blur(3px);
      }
    `,
  ],
})
export default class StarFieldComponent
  extends AbstractWidgetComponent
  implements AfterViewInit
{
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly visibility = inject(VisibilityService);

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('starfield');
  canvasEl = computed(() => this.canvas()?.nativeElement);
  ctx = computed(() => this.canvasEl()?.getContext('2d'));
  rect = linkedSignal<DOMRect>(() => this.getDOMRect());
  width = computed(() => this.rect()?.width ?? 0);
  height = computed(() => this.rect()?.height ?? 0);
  color = linkedSignal(() => this.computedColor());
  stars = signal([] as Star[]);
  onThemeChange = effect(() => {
    // Triggers
    const color = this.color();
    const stars = this.stars();

    // Action
    for (const star of stars) {
      star.setCurrentColor(color);
    }
  });

  animationFrame: number | undefined;

  ngAfterViewInit() {
    if (this.canvas() == null) return;

    // Setup canvas
    const maxStars = this.isFullscreen() ? 5000 : 1000;

    // Initialize stars
    const stars = [];
    for (let i = 0; i < maxStars; i++) {
      stars.push(new Star(this.canvasEl()!, this.ctx()!));
    }
    this.stars.set(stars);

    this.theme.selectedTheme$
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200))
      .subscribe(() => this.color.set(this.computedColor()));

    // Initialize
    this.visibility.browserActive$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((active) => {
        if (active) {
          this.animate();
        } else {
          this.pause();
        }
      });
  }

  private computedColor() {
    const tmp = this.doc.createElement('div');
    tmp.style.cssText = 'color: var(--text-color)';
    this.doc.body.appendChild(tmp);
    const window = globalThis.window || this.doc.defaultView;
    const currentColor = window.getComputedStyle(tmp).color;
    this.doc.body.removeChild(tmp);
    return currentColor;
  }

  private getDOMRect() {
    if (
      this.canvasEl() != null &&
      'getBoundingClientRect' in this.canvasEl()!
    ) {
      return this.canvasEl()!.getBoundingClientRect();
    }
    return { width: 0, height: 0 } as DOMRect;
  }

  // Animation loop
  animate() {
    // Update canvas size
    this.rect.set(this.getDOMRect());
    const centerX = this.width() / 2;
    const centerY = this.height() / 2;

    // Clear
    this.ctx()!.clearRect(0, 0, this.width(), this.height());
    this.ctx()!.translate(centerX, centerY);

    for (const star of this.stars()) {
      star.setCurrentColor(this.color());
      star.draw();
    }
    this.ctx()!.translate(-centerX, -centerY);
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  pause() {
    // If browser tab is inactive, pause the animation
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

    // Draw the pause state
    const centerX = this.width() / 2;
    const centerY = this.height() / 2;
    this.ctx()!.clearRect(0, 0, this.width(), this.height());
    this.ctx()!.translate(centerX, centerY);
    for (const star of this.stars()) {
      star.setCurrentColor(this.color());
      star.draw();
    }

    this.ctx()!.font = '16px Arial';
    this.ctx()!.fillStyle = this.color();
    this.ctx()!.textAlign = 'center';
    this.ctx()!.fillText('Interstellar travel paused', 0, 0);
    this.ctx()!.translate(-centerX, -centerY);
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
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  centerW!: number;
  centerH!: number;
  currentColor!: string;
  rect!: DOMRect;
  large = false;

  startPos!: Point;
  curPos?: Point;
  z!: number;

  size!: number;
  speed!: number;
  angle!: number;
  radius!: number;

  arcs: Arc[] = [];
  retainPositions = 3;

  h = 0;
  s = 0;
  l = 0;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    large = false,
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.large = large;
    if (this.large) this.retainPositions = 5;

    // Initialize
    this.reset();
  }

  setCurrentColor(color: string) {
    this.currentColor = color;
    const [h, s, l] = toHsl(this.currentColor);
    this.h = h;
    this.s = s;
    this.l = l;
  }

  reset() {
    this.rect = this.canvas.getBoundingClientRect();
    this.centerW = this.rect.width / 2;
    this.centerH = this.rect.height / 2;
    this.startPos = {
      x: this.random(-this.centerW, this.centerW),
      y: this.random(-this.centerH, this.centerH),
    };
    delete this.curPos;
    this.z = this.rect.width;
    this.size = this.random(1, this.large ? 4 : 2);
    this.speed = this.random(1, 5);
    this.angle = this.random(0, this.rect.width) * 2 * Math.PI;
    this.arcs = [];
  }

  draw() {
    this.z -= this.speed;

    if (
      this.z <= 0 ||
      Math.abs(this.arcs[0]?.x) >= this.rect.width / 2 ||
      Math.abs(this.arcs[0]?.y) >= this.rect.height / 2
    ) {
      // Star is off screen, reset
      this.reset();
    }

    // lPercent should be either from 50 to 100 if this.l > 50,
    // or from 50 to 0 if this.l < 50
    const percent = (this.z * 100) / this.rect.width;
    const lPercent = this.l > 50 ? 120 - percent : percent - 40;
    const color = `hsl(${this.h}, ${this.s}%, ${lPercent.toFixed(2)}%)`;

    this.curPos = {
      x: this.remap(this.startPos.x / this.z, 0, 1, 0, this.rect.width),
      y: this.remap(this.startPos.y / this.z, 0, 1, 0, this.rect.height),
    };
    this.radius = this.remap(this.z, 0, this.rect.width, this.size, 0);

    this.arcs.push({ x: this.curPos.x, y: this.curPos.y, radius: this.radius });
    if (this.arcs.length > this.retainPositions) {
      this.arcs.shift();
    }
    this.ctx.beginPath();
    this.ctx.arc(this.curPos.x, this.curPos.y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.moveTo(this.curPos.x, this.curPos.y);
    this.ctx.lineTo(this.arcs[0].x, this.arcs[0].y);
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  random(min: number, max: number): number {
    return Math.random() * (max - min + 1) + min;
  }

  remap(
    value: number,
    istart: number,
    istop: number,
    ostart: number,
    ostop: number,
  ): number {
    const deltaI = istop - istart;
    const deltaO = ostop - ostart;
    return ostart + deltaO * ((value - istart) / deltaI);
  }
}
