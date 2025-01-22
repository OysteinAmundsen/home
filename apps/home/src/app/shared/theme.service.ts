import { effect, Injectable, linkedSignal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  selectedTheme = linkedSignal<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'; // Do not run on server
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  private onChange = effect(() => {
    const theme = this.selectedTheme();
    if (typeof window === 'undefined') return; // Do not run on server
    document.startViewTransition(() => {
      document.documentElement.setAttribute('data-schema', theme);
    });
  });
}
