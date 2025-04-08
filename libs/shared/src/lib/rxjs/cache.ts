import { Signal } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
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

function keyToString(key: CacheKey): string {
  if (typeof key === 'function') {
    return key();
  } else if (typeof key === 'string') {
    return key;
  }
  throw new Error('Invalid cache key type');
}

/** The cache map is global */
const cacheMap = new Map<CacheKey, CacheValue>();
/**
 * A simple request cache that stores the result of an observable
 */
export class Cache {
  /** Get a cache map entry */
  static get(key: CacheKey) {
    return cacheMap.get(keyToString(key));
  }

  /** Set a cache map entry */
  static set(key: CacheKey, value: CacheValue) {
    cacheMap.set(keyToString(key), value);
  }

  /** Manipulate a cache map entry */
  static update(key: CacheKey, value: Partial<CacheValue>) {
    key = keyToString(key);
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
 *
 * @example
 * ```ts
 * myApiCall(): Observable<any> {
 *   return cache(() => http.get('https://api'), 'api');
 * }
 *
 * // Call the api twice, the second call will no execute the http call but rather
 * // return the cached result when the first call is done.
 * myApiCall().subscribe(console.log);
 * myApiCall().subscribe(console.log);
 * ```
 * @param callback
 * @param options
 * @returns
 */
export function cache<T>(callback: () => Observable<T>, cacheKey: CacheKey, options?: CacheOptions): Observable<T> {
  const now = Date.now();
  const key = keyToString(cacheKey);
  const subject = new ReplaySubject<T>(CACHE_SIZE);

  let cacheEntry = Cache.get(key);
  if (cacheEntry && cacheEntry.options) {
    options = { ...options, ...cacheEntry.options };
  }

  // Calculate expiration time
  let expires = Number.POSITIVE_INFINITY;
  if (cacheEntry != null && options?.expirationTime) {
    expires = cacheEntry.timestamp + options.expirationTime;
  }

  // If the cache entry is missing or expired, create a new one
  if (!cacheEntry || expires - now < 0) {
    const observable = callback().pipe(shareReplay(CACHE_SIZE));
    cacheEntry = { observable, timestamp: now, options };
    Cache.set(key, cacheEntry);
  }

  // Subscribe to the observable
  const { observable } = cacheEntry;
  observable.subscribe({
    next: (value) => subject.next(value),
    error: (err) => subject.error(err),
    complete: () => subject.complete(),
  });
  return subject.asObservable();
}
