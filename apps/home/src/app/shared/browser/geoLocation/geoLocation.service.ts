import { DestroyRef, inject, Injectable, linkedSignal, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { concatMap, delay, Observable, of, retryWhen, Subscriber, take, throwError } from 'rxjs';
import { objToString } from '../../utils/object';
import { StorageService } from '../storage/storage.service';

export type Geolocation = { latitude: number; longitude: number };

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

  /* Watch ID for geolocation */
  private watchID: number | undefined;
  private maxRetries = 5;
  private retryTimeout = 1000;

  /**
   * An observable that watches the location of the device
   */
  private watchLocation$ = new Observable<Geolocation>((observer: Subscriber<Geolocation>) => {
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
        } as Geolocation;
        if (objToString(pos) !== objToString(this.location())) {
          // Current position differs from stored position
          // Cache the location for later
          this.storage.set('location', pos);
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
    if (typeof window === 'undefined') return undefined;
    const storedPosition = this.storage.get('location');
    if (storedPosition) {
      return storedPosition as Geolocation;
    }
    return undefined;
  });
  location$ = toObservable(this.location);
  error = signal('');

  constructor() {
    this.watchLocation$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe({
      next: (location: Geolocation) => {
        this.location.set(location);
      },
      error: (error) => {
        this.error.set(error);
      },
    });
  }

  private cleanup() {
    if (this.watchID) {
      navigator.geolocation.clearWatch(this.watchID);
    }
  }

  /**
   * Cleanup event listeners
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}
