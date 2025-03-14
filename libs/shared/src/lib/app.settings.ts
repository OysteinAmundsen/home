import { Injectable, signal } from '@angular/core';

/**
 * A service to hold different settings for the app.
 *
 * This could be a part of angular's environment.ts, but perhaps
 * I want to allow the user to change these settings at runtime.
 */
@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  /** Got tired of the background animation, so this is a switch to turn it off */
  animateBackground = signal(false);

  /**
   * Toggle to pause the animations when the window is inactive
   *
   * This is useful for performance reasons, but also useful to turn off for
   * debugging reasons.
   */
  pauseOnInactive = signal(false);

  /**
   * Relevant instrument_id's from nordnet catalogue.
   *
   * These are the funds I'm interested in following.
   */
  watchInstruments = signal<number[]>([16802428, 16801174, 16801692, 18282786]);
}
