import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, linkedSignal } from '@angular/core';

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
    if (typeof window === 'undefined') return; // Do not run on server

    const callback = () => {
      this.doc.documentElement.setAttribute('data-schema', theme);
    };
    if ('startViewTransition' in this.doc) {
      this.doc.startViewTransition(callback);
    } else {
      callback();
    }
  });
}
