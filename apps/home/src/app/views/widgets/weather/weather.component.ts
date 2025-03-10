import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, linkedSignal, OnDestroy, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GeoLocationService } from '../../../shared/browser/geoLocation/geoLocation.service';
import { IconPipe } from '../../../shared/icons/icon.pipe';
import { cache, Cache } from '../../../shared/rxjs/cache';
import { AbstractWidgetComponent } from '../../../shared/widget/abstract-widget.component';
import { WidgetComponent } from '../../../shared/widget/widget.component';

/**
 * A widget integrating with the yr.no weather API
 */
@Component({
  selector: 'app-widget-weather',
  imports: [CommonModule, IconPipe, WidgetComponent],
  template: `
    <app-widget [host]="host()">
      @if (weather.isLoading()) {
        <section>Loading...</section>
      } @else if (weather.error()) {
        <section>{{ weather.error() }}</section>
      } @else if (weather.value()) {
        <section [attr.style]="'view-transition-name: ' + widgetId() + '-content-list'">
          @for (time of todaysWeather(); track time.time) {
            <div class="time">
              <time>{{ time.time | date: 'HH:mm' }}</time>
              <span [outerHTML]="time.data.next_1_hours.summary.symbol_code | icon"> </span>
              <span class="temp">{{ time.data.instant.details.air_temperature | number: '1.1' }}°C</span>
            </div>
          }
        </section>
        <footer [attr.style]="'view-transition-name: ' + widgetId() + '-footer'">
          <span class="material-symbols-outlined">update</span>
          <time>{{ lastUpdated() | date: 'dd.MM.yyyy HH:mm' }}</time>
        </footer>
      }
    </app-widget>
  `,
  styles: `
    :host {
      container-type: size;
      display: block;
      min-height: 20rem;
      min-width: 11.5rem;
    }
    header {
      display: none;
      @container (min-height: 23rem) {
        display: block;
      }
    }
    section {
      place-items: center;
      // view-transition-name: widget-weather-content-list;
      .time {
        display: flex;
        gap: 0.5rem;
        ::ng-deep .material-symbols-outlined {
          color: var(--color-text-highlight);
        }
        .temp {
          width: 3rem;
          text-align: right;
        }
      }
    }
    footer {
      padding-top: 0.5rem;
      display: flex;
      place-items: center;
      place-content: center;
      gap: 0.5rem;
      time {
        color: var(--color-text-highlight);
        font-style: italic;
      }
    }
  `,
})
export default class WeatherComponent extends AbstractWidgetComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly loc = inject(GeoLocationService);

  id = signal('weather');

  timeout: NodeJS.Timeout | undefined;

  /** Computes the url with location query params when location is updated */
  private url = computed(() => {
    const location = this.loc.location();
    if (location == null) return undefined;
    return `/api/weather?lat=${location.latitude}&lon=${location.longitude}`;
  });

  /** Fetch weather data for current position using yr.no api */
  weather = resource({
    // Triggers
    request: () => ({
      url: this.url(),
      error: this.loc.error(),
    }),
    // Actions
    loader: async ({ request }) => {
      // Present error if location gave an error
      if (request.error) throw request.error;
      // Die if location is not available
      if (request.url == null) return undefined;
      // Fetch weather data for location
      return await firstValueFrom(
        cache(() => this.http.get<any>(`${request.url}`), request.url, {
          expirationTime: this.cacheExpirationTime() - 2 * 60 * 1000,
        }),
      );
    },
  });

  /** Set initial expiration time to 30 minutes if no update time is available */
  private cacheExpirationTime = linkedSignal(() => 30 * 60 * 1000);

  /** Holds yr.no last update time */
  lastUpdated = computed(() => this.weather.value()?.properties.meta.updated_at);
  /** Computes next update time. Yr updates once per hour, so no need to ask more often */
  private nextUpdate = computed(() => {
    const lastUpdated = this.lastUpdated();
    // If no update has been made, trigger now
    if (lastUpdated == null) return new Date();
    const lastUpdatedTime = new Date(lastUpdated);
    // Update when one hour and 2 minutes has passed since last update
    return new Date(lastUpdatedTime.getTime() + 62 * 60 * 1000);
  });

  /** Triggers next update when approx one hour has passed since yr.no update time */
  private triggerNextUpdate = effect(() => {
    // Triggers
    const nextUpdateTime = this.nextUpdate();

    // Actions
    // Calculate time until next update and update cache
    const expirationTime = nextUpdateTime.getTime() - Date.now();
    this.cacheExpirationTime.set(expirationTime);
    Cache.update(`${this.url()}`, { options: { expirationTime } });

    // Trigger reload when next update time has passed
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.weather.reload(), nextUpdateTime.getTime() - Date.now());
  });

  /** Display only 12 hours in the widget */
  todaysWeather = computed(() => {
    return ((this.weather.value()?.properties.timeseries || []) as Array<any>).slice(0, 12);
  });

  ngOnDestroy(): void {
    // Cleanup triggers
    if (this.timeout) clearTimeout(this.timeout);
  }
}
