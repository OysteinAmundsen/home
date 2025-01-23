import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

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
        observer.error('Geolocation is not supported in this environment');
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
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    },
  );

  cleanup() {
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
