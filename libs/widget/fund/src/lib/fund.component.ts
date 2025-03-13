import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { firstValueFrom } from 'rxjs';
import { FundService } from './fund.service';

if (typeof window !== 'undefined') {
  echarts.use([LineChart, GridComponent, CanvasRenderer]);
}

@Component({
  selector: 'lib-fund',
  imports: [CommonModule, WidgetComponent, NgxEchartsDirective],
  templateUrl: './fund.component.html',
  styleUrl: './fund.component.scss',
  providers: [{ provide: FundService }, provideEchartsCore({ echarts })],
})
export default class FundComponent extends AbstractWidgetComponent implements OnInit {
  private readonly fundService = inject(FundService);

  override id = signal('fund');
  instruments = signal<any[]>([]);
  canRender = linkedSignal(() => isPlatformBrowser(this.platformId));
  api = signal<echarts.ECharts | undefined>(undefined);

  chartOption: echarts.EChartsCoreOption = {
    xAxis: {
      type: 'time',
    },
    yAxis: {
      type: 'value',
      name: 'NOK',
    },
  };

  mergeOptions = signal<echarts.EChartsCoreOption | undefined>(undefined);

  onDataChanged = effect(() => {
    const api = this.api();
    const options = this.mergeOptions();
    if (api && options) {
      api.setOption(options);
    }
  });

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.fundService.getFundData());

      // For each instrument, fetch price time series
      const timeSeries = [] as { timeStamp: number; value: number }[][];
      await Promise.allSettled(
        data.map(async (item: any) => {
          const res = await firstValueFrom(this.fundService.getTimeSeries(item.nnx_info.market_data_order_book_id));
          item.timeSeries = res;
          timeSeries.push(res.pricePoints);
        }),
      );

      const options = {
        xAxis: {
          type: 'time',
          data: Array.from(
            timeSeries
              .flatMap((point) => point)
              .map((p) => p.timeStamp)
              .reduce((acc, cur) => acc.add(cur), new Set()),
          ),
        },
        series: data.map((item: any) => ({
          name: item.instrument_info.long_name,
          type: 'line',
          data: item.timeSeries.pricePoints.map((p: any) => [p.timeStamp, p.value]),
        })),
      };
      this.mergeOptions.set(options);
    } catch (error) {
      console.error('Error fetching fund data', error);
    }
  }

  onChartInit($event: echarts.ECharts) {
    this.api.set($event);
  }
}
