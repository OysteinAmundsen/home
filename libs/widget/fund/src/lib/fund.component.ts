import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { ResizeDirective } from '@home/shared/browser/resize/resize.directive';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { firstValueFrom } from 'rxjs';
import { FundService } from './fund.service';

@Component({
  selector: 'lib-fund',
  imports: [CommonModule, WidgetComponent, ResizeDirective],
  templateUrl: './fund.component.html',
  styleUrl: './fund.component.scss',
  providers: [{ provide: FundService }],
})
export default class FundComponent extends AbstractWidgetComponent implements OnInit {
  private readonly fundService = inject(FundService);
  graphCanvas = viewChild('graph', { read: ElementRef });
  ctx = computed(() => this.graphCanvas()?.nativeElement.getContext('2d'));

  override id = signal('fund');
  instruments = signal<any[]>([]);

  // Size
  rect = signal<DOMRect>({ width: 0, height: 0 } as DOMRect);
  width = computed(() => this.rect().width);
  height = computed(() => this.rect().height);

  // Graph colors
  private colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5', '#FF8C33', '#8C33FF'];

  onInstrumentChanged = effect(() => {
    // Triggers
    const data = this.instruments();
    const canvas = this.graphCanvas()?.nativeElement;

    if (data.length && this.width() > 0 && this.height() > 0) {
      data.forEach((item: any, index: number) => {
        this.createGraph(canvas, item.timeSeries.pricePoints, index);
      });
    }
  });

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.fundService.getFundData());

      // For each instrument, fetch price time series
      await Promise.allSettled(
        data.map(async (item: any) => {
          const res = await firstValueFrom(this.fundService.getTimeSeries(item.nnx_info.market_data_order_book_id));
          item.timeSeries = res;
        }),
      );
      this.instruments.set(data);
    } catch (error) {
      console.error('Error fetching fund data', error);
    }
  }

  onResize(size: DOMRect) {
    this.rect.set(size);
  }

  private createGraph(
    canvas: HTMLCanvasElement,
    pricePoints: { timestamp: number; value: number }[],
    index: number,
  ): void {
    const ctx = this.ctx();
    if (ctx) {
      const color = this.colors[index % this.colors.length];

      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = color;

      const xScale = canvas.width / (pricePoints.length - 1);
      const yMax = Math.max(...pricePoints.map((p) => p.value));
      const yMin = Math.min(...pricePoints.map((p) => p.value));
      const yScale = canvas.height / (yMax - yMin);

      pricePoints.forEach((point, i) => {
        const x = xScale * i;
        const y = canvas.height - (point.value - yMin) * yScale;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }
  }
}
