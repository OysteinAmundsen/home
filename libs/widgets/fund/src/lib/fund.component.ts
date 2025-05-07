import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, OnInit, resource, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppSettingsService } from '@home/shared/app.settings';
import { ThemeService } from '@home/shared/browser/theme/theme.service';
import { deepMerge } from '@home/shared/utils/object';
import { SpinnerComponent } from '@home/shared/ux/spinner/spinner.component';
import { TypeaheadComponent } from '@home/shared/ux/typeahead/typeahead.component';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { firstValueFrom } from 'rxjs';
import { ColorCodeNumberDirective } from './color-code-number.directive';
import { FundInstrument } from './fund.model';
import { FundService } from './fund.service';

if (typeof window !== 'undefined') {
  echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);
}

@Component({
  selector: 'lib-fund',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WidgetComponent,
    NgxEchartsDirective,
    TypeaheadComponent,
    ColorCodeNumberDirective,
    SpinnerComponent,
  ],
  templateUrl: './fund.component.html',
  styleUrl: './fund.component.scss',
  providers: [provideEchartsCore({ echarts })],
})
export default class FundComponent extends AbstractWidgetComponent implements OnInit {
  // prettier-ignore
  private readonly document = (() => { try { return inject(DOCUMENT); } catch { return document; } })();
  private readonly fundService = inject(FundService);
  private readonly theme = inject(ThemeService);
  private readonly settings = inject(AppSettingsService);

  override id = signal('fund');

  // Got in trouble when rendering through SSR, so skip it when not in browser
  canRender = linkedSignal(() => isPlatformBrowser(this.platformId));
  displayValueFn = (item: any) => item.name || '';
  valueFn = (item: any) => item.id || '';

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
    backgroundColor: 'transparent',
    legend: {
      show: false,
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
    series: [],
  });
  // Set dark mode in chart options when theme changes
  colorSchema = this.theme.selectedTheme;

  // User input and values
  instrumentSearch = new FormControl<string>('', { updateOn: 'change' });
  selectedInstruments = this.settings.watchInstruments;
  availableTimeslots = this.fundService.timeslots;
  selectedTimeslot = this.fundService.selectedTimeslot;

  // Tab switch
  showAll = this.fundService.showAll;

  // Pager
  currentPage = this.fundService.currentPage; // Set in service to persist across routes
  totalInstruments = signal(0);
  maxPage = computed(() => Math.ceil(this.totalInstruments() / 20) - 1);
  hasPrevPage = computed(() => this.currentPage() > 0);
  hasNextPage = computed(() => this.currentPage() < this.maxPage());
  prevPage = () => this.currentPage.update((page) => Math.max(page - 1, 0));
  nextPage = () => this.currentPage.update((page) => Math.min(page + 1, this.maxPage()));

  // Load data
  dataLoader = resource({
    request: () => ({
      // Triggers
      instruments: this.settings.watchInstruments(),
      timeslot: this.selectedTimeslot(),
      showAll: this.showAll(),
      offset: this.currentPage(),
    }),
    loader: async ({ request }) => {
      // Load instrument data
      if (!request.showAll && request.instruments.length === 0) return [];
      const instruments = request.showAll ? [] : request.instruments;
      const response = await firstValueFrom(this.fundService.getFundData(instruments, request.offset * 20));
      const data = response.results || [];
      this.totalInstruments.update(() => response.total_hits || 0);

      // For each instrument, fetch price time series
      await Promise.allSettled(
        data.map(async (item: any) => {
          const id = item.instrument_info.instrument_id;
          const res = await firstValueFrom(this.fundService.getTimeSeries(id, request.timeslot));
          item.timeSeries = res;
        }),
      );
      return data;
    },
  });

  // Render data to graph
  onDataLoaded = effect(() => {
    if (this.dataLoader.isLoading() || this.dataLoader.error()) return;
    const data = this.dataLoader.value();
    // Map data to chart options
    this.chartOption.update((original) => {
      // Clear previous series data
      original['series'] = [];
      // ... before merging in new data because otherwise new data will be merged with old data
      const newOptions = deepMerge(original, {
        grid: {
          bottom: this.isFullscreen() ? 40 : 0,
        },
        series: data.map((item: any) => ({
          id: item.instrument_info.instrument_id,
          name: item.instrument_info.long_name,
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: item.timeSeries.pricePoints.map((p: any) => [p.timeStamp, p.value]),
          emphasis: {
            focus: 'series',
            blurScope: 'coordinateSystem',
          },
        })),
      });
      // Must return a new object to trigger change detection
      return { ...newOptions };
    });

    this.api()?.clear();
    this.api()?.setOption(this.chartOption());
  });

  instruments = computed<FundInstrument[]>(() => {
    const options = this.api()?.getOption() as any;
    const data = this.dataLoader.value() || [];
    if (this.dataLoader.isLoading() || this.dataLoader.error()) {
      return [].map((id) => ({ id, name: '', color: '' })).sort((a: any, b: any) => b.id - a.id);
    }
    return data
      .map((item: any) => {
        let seriesIdx = 0;
        if (options && Array.isArray(options.series)) {
          seriesIdx = (options.series as []).findIndex((s: any) => s.id === item.instrument_info.instrument_id);
        }

        return {
          id: item.instrument_info.instrument_id,
          name: item.instrument_info.long_name,
          color: options?.color[seriesIdx % options?.color.length] ?? '',
          owners: item.statistical_info.number_of_owners,
          yield_1y: item.annual_growth_info.annual_growth_1y,
          yield_3y: item.annual_growth_info.annual_growth_3y,
          yield_5y: item.annual_growth_info.annual_growth_5y,
          yield_10y: item.annual_growth_info.annual_growth_10y,
        } as FundInstrument;
      })
      .sort((a: any, b: any) => a.id - b.id);
  });

  ngOnInit(): void {
    this.instrumentSearch.valueChanges.pipe().subscribe(async (value: any) => {
      if (!value) return;
      // Search for instruments
      this.showAll.set(false);
      this.settings.watchInstruments.update((instruments: any) => {
        if (Array.isArray(value)) {
          return [...instruments, ...value];
        } else if (value != null) {
          return [...instruments, value];
        }
        return instruments;
      });
      this.instrumentSearch.setValue('', { emitEvent: false });
    });
  }
  onChartInit(api: echarts.ECharts) {
    this.api.set(api);
    // Highlight the series and the list item
    api
      .getZr()
      .on('mouseover', (params: any) =>
        this.highlightGraph({ id: this.getSeriesFromEventTarget(params.target)?.id }, undefined, false),
      );
    api
      .getZr()
      .on('mouseout', (params: any) => this.unhighlightGraph({ id: this.getSeriesFromEventTarget(params.target)?.id }));
  }

  private getSeriesFromEventTarget(target: any) {
    // Hack to get the series from the zRender event
    if (!target) return undefined;
    const [key, value] = Object.entries(target).filter(
      ([key, value]: [string, any]) => key.startsWith('__ec_inner') && Object.keys(value).includes('seriesIndex'),
    )[0];
    const idx = (value as any).seriesIndex;
    return (this.chartOption()['series'] as any)[idx];
  }

  // Search to add to watch list
  async searchInstruments(value: string) {
    return await firstValueFrom(this.fundService.searchFunds(value));
  }

  // Add to watch list
  async addInstrument(item: FundInstrument) {
    this.settings.watchInstruments.update((instruments: number[]) => [...instruments, item.id]);
  }

  // Remove from watch list
  async removeInstrument(item: FundInstrument) {
    this.settings.watchInstruments.update((instruments: any) => {
      if (Array.isArray(instruments)) {
        return instruments.filter((i: any) => i !== item.id);
      }
      return instruments;
    });
  }

  // Set default instruments to watch
  setDefaults() {
    this.settings.watchInstruments.set([16802428, 16801174, 16801692, 18282786]);
  }

  // Highlight graph and list item on hover over any of them
  highlightedInstrument = signal<number | undefined>(undefined);
  highlightGraph(instrument: any, $event?: PointerEvent, emit = true) {
    this.highlightedInstrument.set(Number(instrument.id));
    if (emit) {
      this.api()?.dispatchAction({ type: 'highlight', seriesId: instrument.id });
    }
    if ($event) return;
    this.document
      .querySelector('#instrument_' + instrument.id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  unhighlightGraph(instrument = { id: this.highlightedInstrument() }, emit = true) {
    if (emit) {
      this.api()?.dispatchAction({ type: 'downplay', seriesId: instrument.id });
    }
    this.highlightedInstrument.set(undefined);
  }
}
