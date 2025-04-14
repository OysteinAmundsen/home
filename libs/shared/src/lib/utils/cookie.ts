import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, REQUEST_CONTEXT } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CookieService {
  // prettier-ignore
  private readonly document = (() => { try { return inject(DOCUMENT); } catch { return document; } })();
  private readonly platform = inject(PLATFORM_ID);
  private readonly reqCtx = inject(REQUEST_CONTEXT);

  /**
   * Get a cookie by name
   *
   * @param name The name of the cookie
   */
  getCookie(name: string): string {
    let cookieString = '';
    if (isPlatformBrowser(this.platform)) {
      cookieString = this.document.cookie;
    } else {
      cookieString = (this.reqCtx as any)?.cookies || '';
    }
    const match = cookieString.match(new RegExp('(^| )' + name + '=([^;]+)'));
    const value = match ? match[2] : '';
    return value;
  }

  /**
   * Set a cookie with name and value
   *
   * @param name The name of the cookie
   * @param value The value of the cookie
   * @param options Optional settings for the cookie
   *                - `expireIn` The number of days until the cookie expires
   *                - `maxAge` The maximum age of the cookie in seconds
   */
  setCookie(name: string, value: string, options?: { expireIn?: number; maxAge?: number }): void {
    const cookie = [`${name}=${encodeURIComponent(value)}`];

    if (options?.expireIn) {
      const date = new Date();
      date.setTime(date.getTime() + options.expireIn * 24 * 60 * 60 * 1000);
      cookie.push(`expires=${date.toUTCString()}`);
    }

    if (options?.maxAge) {
      cookie.push(`max-age=${options.maxAge}`);
    }

    cookie.push('path=/');
    if (isPlatformBrowser(this.platform)) {
      this.document.cookie = cookie.join('; ');
    }
  }

  /**
   * Remove a cookie by name
   */
  removeCookie(name: string) {
    this.document.cookie = `${name}=; Max-Age=-99999999; path=/`;
  }
}
