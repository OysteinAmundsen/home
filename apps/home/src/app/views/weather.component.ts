import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GeoLocationService } from '../shared/geoLocation/geoLocation.service';
import { IconPipe } from '../shared/icons/icon.pipe';
import { cache } from '../shared/rxjs/cache';
import { Widget } from '../shared/widget/widget.service';

@Component({
  selector: 'app-weather-widget',
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
    section {
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
export default class WeatherComponent {
  http = inject(HttpClient);
  loc = inject(GeoLocationService);
  data = input<Widget>();

  /** Fetch weather data for current position using yr.no api */
  weather = resource({
    // Triggers
    request: () => ({
      location: this.loc.currentLocation(),
      error: this.loc.error(),
    }),
    // Actions
    loader: async ({ request }) => {
      // Present error if location gave an error
      if (request.error) throw request.error;
      // Die if location is not available
      if (request.location == null) return undefined;
      // Fetch weather data for location
      const { latitude, longitude } = request.location;
      const cacheKey = () => `/api/weather?lat=${latitude}&lon=${longitude}`;
      return await firstValueFrom(
        cache(() => this.http.get<any>(cacheKey()), { cacheKey }),
      );
    },
  });

  /** Holds yr.no last update time */
  lastUpdated = computed(
    () => this.weather.value()?.properties.meta.updated_at,
  );

  /** Triggers next update when approx one hour has passed since yr.no update time */
  private nextUpdate = effect(() => {
    // Triggers
    const lastUpdated = this.lastUpdated();
    if (lastUpdated == null) return;
    // Actions
    const now = new Date();
    const lastUpdatedTime = new Date(lastUpdated);
    // Update when one hour and 2 minutes has passed since last update
    let nextUpdateTime = new Date(lastUpdatedTime.getTime() + 62 * 60 * 1000);
    if (nextUpdateTime.getTime() < now.getTime()) {
      // If the next update time is in the past, update in 2 minutes
      nextUpdateTime = new Date(now.getTime() + 2 * 60 * 1000);
    }
    setTimeout(() => {
      this.weather.reload();
    }, nextUpdateTime.getTime() - Date.now());
  });

  /** Display only 12 hours in the widget */
  todaysWeather = computed(() => {
    return (
      (this.weather.value()?.properties.timeseries || []) as Array<any>
    ).slice(0, 12);
  });
}
