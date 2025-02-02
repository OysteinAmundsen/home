import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { cache, CacheOptions } from './cache';

describe('cache operator', () => {
  it('should cache the result of the observable', (done) => {
    const callback = jest.fn(() => of('test').pipe(delay(100)));
    const options: CacheOptions = {};

    const cached$ = cache(callback, options);

    let callCount = 0;
    cached$.subscribe((value) => {
      expect(value).toBe('test');
      expect(callback).toHaveBeenCalledTimes(1);
      callCount++;
      if (callCount === 2) {
        done();
      }
    });

    // Subscribe again to ensure the cached value is used
    cached$.subscribe((value) => {
      expect(value).toBe('test');
      expect(callback).toHaveBeenCalledTimes(1);
      callCount++;
      if (callCount === 2) {
        done();
      }
    });
  });

  it('should handle errors correctly', (done) => {
    const callback = jest.fn(() => throwError(() => new Error('test error')));
    const options: CacheOptions = {};

    const cached$ = cache(callback, options);

    cached$.subscribe({
      next: () => ({}),
      error: (err) => {
        expect(err.message).toBe('test error');
        expect(callback).toHaveBeenCalledTimes(1);
        done();
      },
      complete: () => ({}),
    });
  });

  it('should not call the callback again if the cache is still valid', (done) => {
    const callback = jest.fn(() => of('test').pipe(delay(100)));
    const options: CacheOptions = {};

    const cached$ = cache(callback, options);

    cached$.subscribe((value) => {
      expect(value).toBe('test');
      expect(callback).toHaveBeenCalledTimes(1);
      cached$.subscribe((value) => {
        expect(value).toBe('test');
        expect(callback).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('should call the callback again if the cache is invalidated', (done) => {
    const callback = jest.fn(() => of('test').pipe(delay(100)));
    const options: CacheOptions = { expirationTime: 50 };

    const cached$ = cache(callback, options);

    cached$.subscribe((value) => {
      expect(value).toBe('test');
      expect(callback).toHaveBeenCalledTimes(1);
      setTimeout(() => {
        cached$.subscribe((value) => {
          expect(value).toBe('test');
          expect(callback).toHaveBeenCalledTimes(2);
          done();
        });
      }, 100);
    });
  });
});
