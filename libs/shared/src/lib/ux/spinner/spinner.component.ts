import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { getComputedStyle } from '../../utils/color';

@Component({
  selector: 'lib-spinner',
  template: '<canvas #canvas></canvas>',
  styles: ``,
})
export class SpinnerComponent implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private ctx = computed<CanvasRenderingContext2D | undefined>(() =>
    isPlatformBrowser(this.platformId) && this.canvas()
      ? (this.canvas()?.nativeElement.getContext('2d') ?? undefined)
      : undefined,
  );

  spin = input<boolean>(false);

  dotCount = 3;
  dotRadius = 4;
  dotSpacing = this.dotRadius * 2 + this.dotRadius / 2;
  animationFrame: number | undefined;
  startTime: number | undefined;
  color = '';

  computeStyle() {
    const el = this.el.nativeElement as HTMLElement;
    const computedStyle = getComputedStyle(el);
    const fontSize = parseFloat(computedStyle.fontSize) || 4; // Default to 4px if not set

    // Set styles
    this.dotRadius = Math.round(fontSize / 5.5); // Adjust the divisor to change the size ratio
    this.dotSpacing = this.dotRadius * 2 + this.dotRadius / 2;
    this.color = computedStyle.color || getComputedStyle(el, '--color-text'); // Default to text color if not set
  }

  onSpin = effect(() => {
    if (this.spin()) {
      this.startTime = performance.now();
      this.animate();
    } else {
      this.stop();
    }
  });

  ngOnDestroy() {
    this.stop();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  draw(time: number) {
    if (!this.ctx()) return;
    const ctx = this.ctx()!;
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;

    // Set canvas size if not already set
    canvas.width = this.dotSpacing * (this.dotCount - 1) + this.dotRadius * 4;
    canvas.height = this.dotRadius * 4;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseY = canvas.height / 2;
    const amplitude = this.dotRadius * 1.5;
    const period = 900; // ms

    for (let i = 0; i < this.dotCount; i++) {
      const phase = (i / this.dotCount) * Math.PI * 2;
      const t = ((time % period) / period) * Math.PI * 2;
      const y = baseY + Math.sin(t + phase) * amplitude;

      ctx.beginPath();
      ctx.arc(this.dotRadius * 2 + i * this.dotSpacing, y, this.dotRadius, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  animate(time?: number) {
    if (!this.spin() || !isPlatformBrowser(this.platformId)) return;
    this.computeStyle();

    const now = time ?? performance.now();
    this.draw(now - (this.startTime ?? now));
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }
}
