import { HttpClient } from '@angular/common/http';
import { DestroyRef, effect, inject, Injectable, linkedSignal, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  debounceTime,
  delay,
  filter,
  Observable,
  of,
  retryWhen,
  Subscriber,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { cache } from '../../rxjs/cache';
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
        const pos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        } as GeoLocationItem;
        if (objToString(pos) !== objToString(this.location())) {
          this.storage.set('location.position', pos);
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
        switchMap((value) => (value === 'auto' ? this.watchLocation$ : this.selectedLocation$)),
        filter(() => this.locationMethod() === 'auto'),
      )
      .subscribe({
        next: (location: GeoLocationItem | undefined) => {
          this.error.set('');
          if (location) this.selectLocation(location);
        },
        error: (error) => {
          this.error.set(error);
          this.locationMethod.set('search');
        },
      });

    // Manually search for locations
    this.locationSearchString$
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        debounceTime(500),
        filter((str: string | undefined) => this.locationMethod() === 'search' && (str?.length ?? 0) >= 2),
        switchMap((str: string | undefined) => {
          this.location.set(undefined);
          this.error.set('');
          const url = `/api/location/search?s=${str}`;
          return cache(() => this.http.get<GeoLocationItem[]>(url), url).pipe(
            catchError((err) => {
              this.error.set(err.error.message);
              return of([]);
            }),
          );
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

  /**
   * Cleanup event listeners
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}
