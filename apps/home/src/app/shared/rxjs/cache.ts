import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

const CACHE_SIZE = 1;

export type CacheKey = string | Signal<string> | (() => string);
export type CacheValue = {
  observable: Observable<any>;
  timestamp: number;
  options?: CacheOptions;
};
export type CacheOptions = {
  expirationTime?: number;
};

/** The cache map is global */
const cacheMap = new Map<CacheKey, CacheValue>();
/**
 * A simple request cache that stores the result of an observable
 */
export class Cache {
  /** Get a cache map entry */
  static get(key: CacheKey) {
    return cacheMap.get(key);
  }

  /** Set a cache map entry */
  static set(key: CacheKey, value: CacheValue) {
    cacheMap.set(key, value);
  }

  /** Manipulate a cache map entry */
  static update(key: CacheKey, value: Partial<CacheValue>) {
    const current = cacheMap.get(key);
    if (current) {
      cacheMap.set(key, { ...current, ...value });
    }
  }
}

/**
 * Cache the result of an observable for a certain amount of time
 *
 * This will guarantee that the inner observable is only subscribed
 * to once and the result is shared between all subscribers.
 *
 * @param callback
 * @param options
 * @returns
 */
export function cache<T>(callback: () => Observable<T>, cacheKey: CacheKey, options?: CacheOptions): Observable<T> {
  return new Observable<T>((observer) => {
    const now = Date.now();
    const key = typeof cacheKey === 'function' ? cacheKey() : cacheKey;
    let cacheEntry = Cache.get(key);
    if (cacheEntry && cacheEntry.options) {
      options = { ...options, ...cacheEntry.options };
    }

    if (!cacheEntry || (options?.expirationTime && now - cacheEntry.timestamp > options.expirationTime)) {
      const observable = callback().pipe(shareReplay(CACHE_SIZE));
      cacheEntry = { observable, timestamp: now, options };
      Cache.set(key, cacheEntry);
    }

    const { observable } = cacheEntry;

    observable.subscribe({
      next(value) {
        observer.next(value);
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      },
    });
  });
}
