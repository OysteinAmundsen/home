/* eslint-disable no-unused-private-class-members */
import { effect, inject, Injectable, signal } from '@angular/core';
import { StorageService } from './browser/storage/storage.service';

/**
 * A service to hold different settings for the app.
 *
 * This could be a part of angular's environment.ts, but perhaps
 * I want to allow the user to change these settings at runtime.
 */
@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  // Must use native private fields to avoid listing in the settings form panel
  readonly #storage = inject(StorageService);

  /** Got tired of the background animation, so this is a switch to turn it off */
  animateBackground = signal(this.#storage.get('settings.animateBackground', false));
  #animateBackgroundChanged = effect(() => this.#storage.set('settings.animateBackground', this.animateBackground()));

  /**
   * Toggle to pause the animations when the window is inactive
   *
   * This is useful for performance reasons, but also useful to turn off for
   * debugging reasons.
   */
  pauseOnInactive = signal(this.#storage.get('settings.pauseOnInactive', false));
  #pauseOnInactiveChanged = effect(() => this.#storage.set('settings.pauseOnInactive', this.pauseOnInactive()));

  /**
   * Relevant instrument_id's from nordnet catalogue.
   *
   * These are the funds I'm interested in following.
   */
  watchInstruments = signal<number[]>(
    this.#storage.get('settings.watchInstruments', [16802428, 16801174, 16801692, 18282786]) as number[],
  );
  #watchInstrumentsChanged = effect(() => this.#storage.set('settings.watchInstruments', this.watchInstruments()));
}
