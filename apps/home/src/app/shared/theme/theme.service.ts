import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, linkedSignal } from '@angular/core';
import { doSafeTransition } from '../utils/transitions';

/**
 * This site supports a light and dark color scheme.
 *
 * The css will autoselect the color scheme based on the user's preference,
 * but the user can also manually select the color scheme. This service
 * keeps track of the currently selected color scheme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  doc = inject(DOCUMENT);
  selectedTheme = linkedSignal<'light' | 'dark'>(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window))
      return 'light'; // Do not run on server
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  private onChange = effect(() => {
    const theme = this.selectedTheme();
    doSafeTransition(() =>
      this.doc.documentElement.setAttribute('data-schema', theme),
    );
  });
}
