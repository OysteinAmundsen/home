import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, linkedSignal, resource, signal } from '@angular/core';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';

import * as echarts from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { AppSettingsService } from '@home/shared/app.settings';
import { ThemeService } from '@home/shared/browser/theme/theme.service';
import { getComputedStyle, setAlpha } from '@home/shared/utils/color';
import { deepMerge } from '@home/shared/utils/object';
import { firstValueFrom } from 'rxjs';
import { FundService } from './fund.service';

if (typeof window !== 'undefined') {
  echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);
}

@Component({
  selector: 'lib-fund',
  imports: [CommonModule, WidgetComponent, NgxEchartsDirective],
  templateUrl: './fund.component.html',
  styleUrl: './fund.component.scss',
  providers: [{ provide: FundService }, provideEchartsCore({ echarts })],
})
export default class FundComponent extends AbstractWidgetComponent {
  private readonly fundService = inject(FundService);
  private readonly theme = inject(ThemeService);
  private readonly settings = inject(AppSettingsService);
  private readonly document = inject(DOCUMENT);

  override id = signal('fund');

  // Got in trouble when rendering through SSR, so skip it when not in browser
  canRender = linkedSignal(() => isPlatformBrowser(this.platformId));

  // The chart API
  api = signal<echarts.ECharts | undefined>(undefined);
  // The chart options
  chartOption = signal<echarts.EChartsCoreOption>({
    grid: {
      top: 30,
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: true,
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: 'var(--color-text)',
      },
    },
    xAxis: {
      type: 'time',
    },
    yAxis: {
      type: 'value',
      name: 'NOK',
    },
    tooltip: {
      trigger: 'axis',
    },
  });
  // Set dark mode in chart options when theme changes
  onThemeChanged = effect(() => {
    const theme = this.theme.selectedTheme();
    const s = getComputedStyle(this.document.body, '--animation-duration', 'duration');
    const duration = parseFloat(s) * (/\ds$/.test(s) ? 1000 : 1);
    setTimeout(() => {
      this.chartOption.update((original) => {
        const legendColor = getComputedStyle(this.document.body, 'color');
        const axisColor = legendColor ? setAlpha(legendColor, 0.5) : legendColor;
        const splitColor = legendColor ? setAlpha(legendColor, 0.1) : legendColor;
        const newOptions = deepMerge(original, {
          darkMode: theme === 'dark',
          legend: { textStyle: { color: legendColor } },
          xAxis: {
            axisLabel: { color: axisColor },
          },
          yAxis: {
            axisLabel: { color: axisColor },
            axisLine: { lineStyle: { color: axisColor } },
            splitLine: { lineStyle: { color: splitColor } },
          },
          tooltip: {
            show: this.isFullscreen(),
          },
        });
        return { ...newOptions };
      });
    }, duration);
  });

  availableTimeslots = this.fundService.timeslots;
  selectedTimeslot = linkedSignal(() => this.fundService.timeslots[1].value);
  dataLoader = resource({
    request: () => ({
      instruments: this.settings.watchInstruments(),
      timeslot: this.selectedTimeslot(),
    }),
    loader: async ({ request }) => {
      // Load instrument data
      const data = await firstValueFrom(this.fundService.getFundData(request.instruments));

      // For each instrument, fetch price time series
      await Promise.allSettled(
        data.map(async (item: any) => {
          const res = await firstValueFrom(
            this.fundService.getTimeSeries(item.nnx_info.market_data_order_book_id, request.timeslot),
          );
          item.timeSeries = res;
        }),
      );
      // Map data to chart options
      this.chartOption.update((original) => {
        if ('series' in original && Array.isArray(original['series'])) {
          original['series'].forEach((s) => {
            s.data = [];
          });
        }
        const newOptions = deepMerge(original, {
          grid: {
            bottom: this.isFullscreen() ? 40 : 0,
          },
          legend: {
            data: data.map((item: any) => item.instrument_info.long_name),
            show: this.isFullscreen(),
          },
          series: data.map((item: any) => ({
            name: item.instrument_info.long_name,
            type: 'line',
            smooth: true,
            data: item.timeSeries.pricePoints.map((p: any) => [p.timeStamp, p.value]),
          })),
        });
        // Must return a new object to trigger change detection
        return { ...newOptions };
      });

      this.api()?.clear();
      this.api()?.setOption(this.chartOption());

      return data;
    },
  });

  onChartInit($event: echarts.ECharts) {
    this.api.set($event);
  }
}
