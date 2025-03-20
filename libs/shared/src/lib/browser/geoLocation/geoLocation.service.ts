import { HttpClient } from '@angular/common/http';
import { DestroyRef, effect, inject, Injectable, linkedSignal, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { cache } from '@home/shared/rxjs/cache';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  debounceTime,
  delay,
  Observable,
  of,
  retryWhen,
  Subscriber,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { objToString } from '../../utils/object';
import { StorageService } from '../storage/storage.service';
import { GeoLocationItem } from './location.model';

/**
 * A service which wraps the geolocation API in an observable.
 *
 * This service will watch the location of the device and emit the new location
 * every time it changes - IF the user has allowed the browser access to their location.
 *
 * The `location` is provided here as both a signal and an observable to allow for
 * both reactive and imperative usage.
 *
 * @example
 * ```ts
 * // Subscribe to changes
 * geoLocationService.location$.subscribe(location => console.log(`SUBCRIPTION: ${location}`));
 *
 * // Ask for the current location
 * console.log(`MANUAL CHECK: ${geoLocationService.location()}`);
 * ```
 *
 */
@Injectable({ providedIn: 'root' })
export class GeoLocationService implements OnDestroy {
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly storage = inject(StorageService);
  private readonly http = inject(HttpClient);

  /* Watch ID for geolocation */
  private watchID: number | undefined;
  private maxRetries = 5;
  private retryTimeout = 1000;

  locationMethod = linkedSignal<'search' | 'auto'>(
    () => this.storage.get('location.method', 'search') as 'search' | 'auto',
  );
  private onLocationMethodChanged = effect(() => {
    const method = this.locationMethod();
    this.storage.set('location.method', method);
    this.possibleLocations.set([]);
    if (method === 'search') {
      this.locationSearchString$.next(this.storage.get('location.address', '') as string);
    }
  });
  private locationMethod$ = toObservable(this.locationMethod);

  locationSearchString$ = new BehaviorSubject<string>(this.storage.get('location.address', '') as string);
  possibleLocations = signal<GeoLocationItem[]>([]);

  private selectedLocation$ = new BehaviorSubject<GeoLocationItem | undefined>(undefined);
  selectedLocation = toSignal(this.selectedLocation$);

  /**
   * An observable that watches the location of the device
   */
  private watchLocation$ = new Observable<GeoLocationItem>((observer: Subscriber<GeoLocationItem | undefined>) => {
    if (typeof window === 'undefined') {
      // Do not ask for geolocation in SSR
      observer.error('Loading...');
      return;
    }
    if (!navigator.geolocation) {
      // Browser does not support geolocation
      observer.error('Geolocation is not supported by your browser');
      return;
    }

    // There can only be one watch at a time
    if (this.watchID) this.cleanup();

    // Start with the cached location
    if (this.location()) observer.next(this.location());

    // Watch the location and report changes
    this.watchID = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        // Will trigger every time device location changes
        const pos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        } as GeoLocationItem;
        if (objToString(pos) !== objToString(this.location())) {
          // Current position differs from stored position
          // Cache the location for later
          this.storage.set('location.position', pos);
          // Return current position
          observer.next(pos);
        }
      },
      (error: GeolocationPositionError) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            observer.error('You denied the request for Geolocation.');
            break;
          case error.POSITION_UNAVAILABLE:
            observer.error('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            observer.error('The request to get location timed out.');
            break;
          default:
            observer.error(error.message);
        }
        this.locationMethod.set('search');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }).pipe(
    retryWhen((errors) =>
      errors.pipe(
        concatMap((error, count) => {
          if (count < this.maxRetries && error === 'The request to get location timed out.') {
            return of(error).pipe(delay(this.retryTimeout));
          }
          return throwError(error);
        }),
        take(this.maxRetries),
      ),
    ),
  );

  location = linkedSignal(() => {
    const defaultLocation = undefined;
    if (typeof window === 'undefined') return defaultLocation;
    const storedPosition = this.storage.get('location.position');
    if (storedPosition) {
      return storedPosition as GeoLocationItem;
    }
    return defaultLocation;
  });
  location$ = toObservable(this.location);
  error = signal('');

  constructor() {
    // Stream the currently selected location
    // A location can either be manually selected, or automatically updated
    // using the geolocation api. User has to select which method to use.
    // Default is manual search.
    this.locationMethod$
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        switchMap((value) => {
          switch (value) {
            case 'auto':
              return this.watchLocation$;
            default:
              return this.selectedLocation$;
          }
        }),
      )
      .subscribe({
        next: (location: GeoLocationItem | undefined) => {
          if (this.locationMethod() !== 'auto') return;
          this.error.set('');
          if (location) {
            this.location.set(location);
          }
        },
        error: (error) => {
          this.error.set(error);
          this.locationMethod.set('search');
        },
      });

    // Manually search for locations
    this.locationSearchString$
      .pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef$),
        switchMap((str: string | undefined) => {
          const storedCity = this.storage.get('location.address', '');
          if (this.locationMethod() === 'search') {
            this.location.set(undefined);
            if ((str?.length ?? 0) < 2) return of([]);
            return this.search(str).pipe(
              catchError((err) => {
                this.error.set(err.error.message);
                return of([] as GeoLocationItem[]);
              }),
            );
          } else {
            return of([]);
          }
        }),
      )
      .subscribe({
        next: (locations) => {
          if (this.locationMethod() !== 'search') return;
          this.possibleLocations.set(locations);
          if (locations.length === 0) {
            this.storage.remove('location.address');
            this.storage.remove('location.position');
          }
          if (locations.length === 1) {
            const storedCity = this.storage.get('location.address', '');
            this.selectedLocation$.next(undefined);
            if (storedCity === locations[0]?.address) {
              this.selectLocation(locations[0]);
            }
          }
        },
      });
  }

  private cleanup() {
    if (this.watchID) {
      navigator.geolocation.clearWatch(this.watchID);
    }
  }

  selectLocation(location: GeoLocationItem) {
    this.selectedLocation$.next(location);
    this.storage.set('location.position', location);
    this.location.set(location);
    if (location.address) {
      this.storage.set('location.address', location.address);
    }
  }

  search(str: string | undefined): Observable<GeoLocationItem[]> {
    this.error.set('');
    if (!str) return of([] as GeoLocationItem[]);
    return cache(
      () => this.http.get<GeoLocationItem[]>(`/api/location/search?s=${str}`),
      `/api/location/search?s=${str}`,
    );
  }

  /**
   * Cleanup event listeners
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}
