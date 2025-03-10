import { computed, linkedSignal, Signal, signal } from '@angular/core';
import { strToHSL } from '../../../shared/utils/color';

type Point = {
  x: number;
  y: number;
};

type Arc = {
  x: number;
  y: number;
  radius: number;
};

/**
 * A star in the starfield
 *
 * Each star is responsible for calculating their own position, color and movement.
 */
export class Star {
  // Canvas and sizes
  private canvas: Signal<HTMLCanvasElement | undefined>;
  private ctx = computed<CanvasRenderingContext2D | undefined>(() => this.canvas()?.getContext('2d') || undefined);
  private rect = linkedSignal<DOMRect>(
    () => this.canvas()?.getBoundingClientRect() || ({ width: 0, height: 0 } as DOMRect),
  );
  private center = computed<Point>(() => ({
    x: this.rect().width / 2,
    y: this.rect().height / 2,
  }));

  // Colors
  private currentColor = signal('#fff');
  private hslColor = linkedSignal(() => strToHSL(this.currentColor()));
  private _lastColor = '';
  private color = computed(() => {
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
  private _lastHalfColor = '';
  private halfColor = computed(() => {
    const [h, s, l] = this.hslColor();
    return `hsl(${h}deg, ${s / 2}%, ${l}%, 50%)`;
  });
  private large = false;

  // Position and movement
  private startPos = signal<Point>({ x: 0, y: 0 });
  private curPos = computed(() => {
    const z = this.z();
    const { x, y } = this.startPos();
    const { width, height } = this.rect();
    return {
      x: this.remap(x / z, 0, 1, 0, width),
      y: this.remap(y / z, 0, 1, 0, height),
    };
  });
  private z = signal(0);
  private size = 0;
  private speed = 0;
  private angle = 0;
  private radius = computed(() => {
    const z = this.z();
    const { width } = this.rect();
    return this.remap(z, 0, width, this.size, 0);
  });

  private arcs: Arc[] = [];
  private retainPositions = 3;

  constructor(canvas: Signal<HTMLCanvasElement | undefined>, large = false) {
    this.canvas = canvas;
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

  private reset() {
    const { x, y } = this.center();
    // this.startPos.set({ x: -x + 100, y: -y + 100 });
    this.startPos.set({
      x: this.random(-x, x),
      y: this.random(-y, y),
    });
    const { width } = this.rect();
    const [h, s, l] = strToHSL(this.currentColor());
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

  private random(min: number, max: number): number {
    return Math.random() * (max - min + 1) + min;
  }

  private remap(value: number, istart: number, istop: number, ostart: number, ostop: number): number {
    const deltaI = istop - istart;
    const deltaO = ostop - ostart;
    return ostart + deltaO * ((value - istart) / deltaI);
  }
}
