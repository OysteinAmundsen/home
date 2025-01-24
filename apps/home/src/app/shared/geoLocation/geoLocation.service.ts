import { Injectable, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subscriber } from 'rxjs';

/**
 * A service which wraps the geolocation API in an observable.
 *
 * This service will watch the location of the device and emit the new location
 * every time it changes.
 */
@Injectable({ providedIn: 'root' })
export class GeoLocationService implements OnDestroy {
  /* Watch ID for geolocation */
  private watchID: number | undefined;

  /**
   * An observable that watches the location of the device
   */
  watchLocation$ = new Observable<{ latitude: number; longitude: number }>(
    (observer: Subscriber<{ latitude: number; longitude: number }>) => {
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
      if (this.watchID) this.cleanup(); // There can only be one watch at a time
      this.watchID = navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          // Will trigger every time device location changes
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
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
    },
  );

  /**
   * A signal containing a snapshot of the current location of the device.
   */
  getCurrentLocation = toSignal(this.watchLocation$);

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
