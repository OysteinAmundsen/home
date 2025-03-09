import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, linkedSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CookieService } from '../../utils/cookie';
import { doSafeTransition } from '../../utils/transitions';

export type Theme = 'light' | 'dark';

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
  cookieService = inject(CookieService);

  selectedTheme = linkedSignal<Theme>(() => {
    const cookie = this.cookieService.getCookie('theme');
    if (cookie && ['light', 'dark'].includes(cookie)) return cookie as Theme;

    if (typeof window === 'undefined' || !('matchMedia' in window)) return 'light'; // Do not run on server
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  selectedTheme$ = toObservable(this.selectedTheme);

  private onChange = effect(() => {
    const theme = this.selectedTheme();

    // Store the selection in a cookie
    this.cookieService.setCookie('theme', theme, { expireIn: 365 });

    doSafeTransition(() => this.doc.documentElement.setAttribute('data-schema', theme));
  });
}
