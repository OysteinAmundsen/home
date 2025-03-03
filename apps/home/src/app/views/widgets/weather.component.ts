import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  OnDestroy,
  resource,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GeoLocationService } from '../../shared/geoLocation/geoLocation.service';
import { IconPipe } from '../../shared/icons/icon.pipe';
import { cache, Cache } from '../../shared/rxjs/cache';
import { AbstractWidgetComponent } from '../../shared/widget/abstract-widget.component';

@Component({
  selector: 'app-widget-weather',
  imports: [CommonModule, IconPipe],
  template: `
    @if (weather.isLoading()) {
      <header>Loading...</header>
    } @else if (weather.error()) {
      <header>{{ weather.error() }}</header>
    } @else if (weather.value()) {
      <section>
        @for (time of todaysWeather(); track time.time) {
          <div class="time">
            <time>{{ time.time | date: 'HH:mm' }}</time>
            <span
              [outerHTML]="time.data.next_1_hours.summary.symbol_code | icon"
            >
            </span>
            <span class="temp"
              >{{
                time.data.instant.details.air_temperature | number: '1.1'
              }}°C</span
            >
          </div>
        }
      </section>
      <footer>
        <span class="material-symbols-outlined">update</span>
        <time>{{ lastUpdated() | date: 'dd.MM.yyyy HH:mm' }}</time>
      </footer>
    }
  `,
  styles: `
    :host {
      view-transition-class: 'widget';
      view-transition-name: weather;
    }
    section {
      view-transition-name: weather-content;
      place-items: center;
      .time {
        display: flex;
        gap: 0.5rem;
        ::ng-deep .material-symbols-outlined {
          color: var(--text-emphasis-color);
        }
        .temp {
          width: 3rem;
          text-align: right;
        }
      }
    }
    footer {
      view-transition-name: weather-footer;
      padding-top: 0.5rem;
      display: flex;
      place-items: center;
      time {
        color: var(--text-emphasis-color);
        font-style: italic;
      }
    }
  `,
})
export default class WeatherComponent
  extends AbstractWidgetComponent
  implements OnDestroy
{
  http = inject(HttpClient);
  loc = inject(GeoLocationService);

  timeout: NodeJS.Timeout | undefined;

  /** Computes the url with location query params when location is updated */
  private url = computed(() => {
    const location = this.loc.currentLocation();
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
          expirationTime: this.cacheExpirationTime(),
        }),
      );
    },
  });

  /** Set initial expiration time to 30 minutes if no update time is available */
  private cacheExpirationTime = linkedSignal(() => 30 * 60 * 1000);

  /** Holds yr.no last update time */
  lastUpdated = computed(
    () => this.weather.value()?.properties.meta.updated_at,
  );
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
    this.timeout = setTimeout(
      () => this.weather.reload(),
      nextUpdateTime.getTime() - Date.now(),
    );
  });

  /** Display only 12 hours in the widget */
  todaysWeather = computed(() => {
    return (
      (this.weather.value()?.properties.timeseries || []) as Array<any>
    ).slice(0, 12);
  });

  ngOnDestroy(): void {
    // Cleanup triggers
    if (this.timeout) clearTimeout(this.timeout);
  }
}
