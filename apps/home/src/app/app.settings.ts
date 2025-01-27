import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  // Got tired of the background animation, so this is a switch to turn it off
  animateBackground = signal(false);
}
