import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  OnDestroy,
  OnInit,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GeoLocationService } from '@home/shared/browser/geo-location/geo-location.service';
import { GeoLocationItem } from '@home/shared/browser/geo-location/location.model';
import { IconPipe } from '@home/shared/pipes/icon.pipe';
import { cache, Cache } from '@home/shared/rxjs/cache';
import { PopoverAnchorDirective } from '@home/shared/ux/popover/popover-anchor.directive';
import { PopoverComponent } from '@home/shared/ux/popover/popover.component';
import { SpinnerComponent } from '@home/shared/ux/spinner/spinner.component';
import { AbstractWidgetComponent } from '@home/shared/widget/abstract-widget.component';
import { WidgetComponent } from '@home/shared/widget/widget.component';
import { firstValueFrom } from 'rxjs';
/**
 * A widget integrating with the yr.no weather API
 */
@Component({
  selector: 'lib-widget-weather',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconPipe,
    WidgetComponent,
    PopoverAnchorDirective,
    PopoverComponent,
    SpinnerComponent,
  ],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss',
})
export default class WeatherComponent extends AbstractWidgetComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly locationService = inject(GeoLocationService);

  id = signal('weather');

  timeout: NodeJS.Timeout | undefined;

  locationMethod = this.locationService.locationMethod;
  onLocationMethodChanged = effect(() => {
    const method = this.locationMethod();
    const input = this.cityInput();
    if (method !== 'auto' && input != null && input.nativeElement != null) {
      setTimeout(() => {
        input.nativeElement.click();
        input.nativeElement.focus();
      });
    }
  });

  locationSearch = new FormControl(this.locationService.locationSearchString$.value);
  possibleLocations = this.locationService.possibleLocations;
  locationPopover = viewChild(PopoverComponent);
  cityInput = viewChild<ElementRef<HTMLInputElement>>('cityInput');
  onLocationsUpdated = effect(() => {
    const popover = this.locationPopover();
    const locations = this.possibleLocations();
    const canOpen =
      locations.filter((l) => l != null && l.address != null).length > 0 &&
      this.locationMethod() === 'search' &&
      this.locationService.location() == null;
    if (popover) {
      if (canOpen && this.locationService.location() == null) {
        popover.open();
      } else {
        popover.close();
      }
    }
  });
  selectLocation(location: GeoLocationItem) {
    this.locationService.selectLocation(location);
    if (this.locationMethod() === 'search')
      this.locationSearch.setValue(location?.city ?? location?.address ?? '', { emitEvent: false });
  }

  /** Computes the url with location query params when location is updated */
  private url = computed(() => {
    const location = this.locationService.location();
    if (location == null) return undefined;
    // The geolocation api gives a resolution of 6 digits, which is approximately 10 cm.
    // By using all decimal places, mobile devices tries to load data for every minor movements,
    // which is overkill for a weather forecast. We fix the position to the nearest 100m by using 3 digits.
    // This is a good tradeoff between accuracy and performance.
    return `/api/weather?lat=${location.latitude.toFixed(3)}&lon=${location.longitude.toFixed(3)}`;
  });

  /** Fetch weather data for current position using yr.no api */
  weather = resource({
    // Triggers
    params: () => ({
      url: this.url(),
      error: this.locationService.error(),
    }),
    // Actions
    loader: async ({ params }) => {
      // Present error if location gave an error
      if (params.error) throw params.error;
      // Die if location is not available
      if (params.url == null) return undefined;
      // Fetch weather data for location
      return await firstValueFrom(
        cache(() => this.http.get<any>(`${params.url}`), params.url, {
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
    if (this.locationMethod() === 'search' && this.locationService.location() == null) return [];
    return ((this.weather.value()?.properties.timeseries || []) as Array<any>).slice(0, 12);
  });

  toggleLocationMethod() {
    this.locationMethod.set(this.locationMethod() === 'search' ? 'auto' : 'search');
  }

  ngOnInit(): void {
    this.locationSearch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((str: string | null) => this.locationService.locationSearchString$.next(str || ''));
  }

  ngOnDestroy(): void {
    // Cleanup triggers
    if (this.timeout) clearTimeout(this.timeout);
  }
}
