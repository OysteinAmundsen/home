import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

const CACHE_SIZE = 1;

export type CacheOptions = {
  expirationTime?: number;
  cacheKey?: () => string;
};

const cacheMap = new Map<
  string,
  { observable: Observable<any>; timestamp: number }
>();

/**
 * Cache the result of an observable for a certain amount of time
 *
 * This will guarantee that the inner observable is only subscribed
 * to once and the result is shared between all subscribers.
 *
 * NOTE: This has a serious flaw that should be addressed in the future:
 * If no `cacheKey` is provided, the cache will be based on the
 * string representation of the callback function. So if the callback
 * is `() => this.http.get('api/widgets' + (request ? '/' + request.id : ''))`
 * then the cache will be based on that string. This means that the same
 * response will be given regardless of the `request` parameter. So in
 * effect, the `cacheKey` is required to make the cache work as expected.
 *
 * But I have no idea how this should be fixed. One way could be to make
 * a `cacheHttp` operator which takes in the url directly and caches the
 * response based on that. But that would limit the use of the cache to
 * only http requests. So I'm not sure what the best solution is.
 *
 * @param callback
 * @param options
 * @returns
 */
export function cache<T>(
  callback: () => Observable<T>,
  options?: CacheOptions,
): Observable<T> {
  const key = options?.cacheKey
    ? options.cacheKey()
    : JSON.stringify(callback.toString()); // FIXME: This should be fixed

  return new Observable<T>((observer) => {
    const now = Date.now();
    let cacheEntry = cacheMap.get(key);

    if (
      !cacheEntry ||
      (options?.expirationTime &&
        now - cacheEntry.timestamp > options.expirationTime)
    ) {
      const observable = callback().pipe(shareReplay(CACHE_SIZE));
      cacheEntry = { observable, timestamp: now };
      cacheMap.set(key, cacheEntry);
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
