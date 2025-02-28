import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ThemeService } from '../shared/theme/theme.service';
import { VisibilityService } from '../shared/visibility/visibility.service';
import { Widget } from '../shared/widget/widget.service';

@Component({
  selector: 'app-widget2',
  template: `
    <canvas #starfield [width]="width()" [height]="height()"></canvas>
  `,
  styles: [
    `
      canvas {
        display: block;
        min-width: 300px;
        width: calc(100% + 2rem);
        height: calc(100% + 2rem);
        transition:
          opacity 0.3s,
          filter 0.3s;
        margin: -1rem;
      }
      :root .inactive :host canvas {
        // opacity: 0.3;
        // filter: blur(3px);
      }
    `,
  ],
})
export default class StarFieldComponent implements AfterViewInit {
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly visibility = inject(VisibilityService);

  data = input<Widget>();

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
    // Setup canvas
    const maxStars = 1000;

    // Initialize stars
    const stars = [];
    for (let i = 0; i < maxStars; i++) {
      stars.push(new Star(this.canvas()!.nativeElement, this.ctx()!));
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
      star.update();
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
      star.setCurrentColor(this.color() + '44');
      star.draw();
    }

    this.ctx()!.font = '16px Arial';
    this.ctx()!.fillStyle = this.color();
    this.ctx()!.textAlign = 'center';
    this.ctx()!.fillText('Interstellar travel paused', 0, 0);
    this.ctx()!.translate(-centerX, -centerY);
  }
}

// Star object
class Star {
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  x!: number;
  y!: number;
  z!: number;
  starX!: number;
  starY!: number;
  size!: number;
  speed!: number;
  angle!: number;
  radius!: number;
  centerW!: number;
  centerH!: number;
  currentColor!: string;
  rect!: DOMRect;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Initialize
    this.reset();
  }

  setCurrentColor(color: string) {
    this.currentColor = color;
  }

  reset() {
    this.rect = this.canvas.getBoundingClientRect();
    this.centerW = this.rect.width / 2;
    this.centerH = this.rect.height / 2;
    this.x = this.random(-this.centerW, this.centerW);
    this.y = this.random(-this.centerH, this.centerH);
    this.z = this.rect.width;
    this.size = this.random(1, 2);
    this.speed = this.random(1, 5);
    this.angle = this.random(0, this.rect.width) * 2 * Math.PI;
  }

  update() {
    this.z -= this.speed;
    if (this.z <= 0) {
      this.reset();
    }
    const xRatio = this.x / this.z;
    const yRatio = this.y / this.z;
    this.starX = this.remap(xRatio, 0, 1, 0, this.rect.width);
    this.starY = this.remap(yRatio, 0, 1, 0, this.rect.height);
    this.radius = this.remap(this.z, 0, this.rect.width, this.size, 0);
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.starX, this.starY, this.radius, 0, Math.PI * 2, false);
    this.ctx.closePath();
    this.ctx.fillStyle = this.currentColor;
    this.ctx.fill();
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
