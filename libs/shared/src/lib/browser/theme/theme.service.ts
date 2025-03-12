import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, linkedSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CookieService } from '../../utils/cookie';
import { doSafeTransition } from '../../utils/transitions';

export type Theme = 'light' | 'dark';

/**
 * This site supports a light and dark color scheme.
 *
 * CSS will autoselect the color scheme based on the user's preference,
 * but the user can also manually select the color scheme. This service
 * keeps track of the currently selected color scheme and exposes the
 * currently `selectedTheme` as both a signal and a stream to allow for
 * both reactive and imperative usage.
 *
 * The color scheme is stored in a cookie so that it persists across sessions
 * and allow for SSR to render using the correct color scheme.
 *
 * @example
 * ```ts
 * // Subscribe to changes
 * themeService.selectedTheme$.subscribe(theme =>  console.log(`SUBCRIPTION: ${theme}`));
 *
 * // Set the theme
 * themeService.selectedTheme.set('dark');
 *
 * // Ask for the current theme
 * console.log(`MANUAL CHECK: ${themeService.selectedTheme()}`);
 * ```
 *
 * The above will log out the following:
 * ```
 * // => SUBCRIPTION: light
 * // => SUBCRIPTION: dark
 * // => MANUAL CHECK: dark
 * ```
 *
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly cookieService = inject(CookieService);

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
