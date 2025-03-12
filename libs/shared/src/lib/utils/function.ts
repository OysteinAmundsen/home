/**
 * Debounce function decorator
 *
 * @example
 * ```ts
 * ⠀@Debouncer(200)
 *  myMethod() {
 *    console.log('debounced');
 *  }
 * ```
 *
 * @param delay
 * @param shouldInvokeImmediately
 * @returns the function debounced
 */
export function Debouncer(delay = 200, immediate = false): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      if (!Object.hasOwnProperty.call(this, propertyKey)) {
        Object.defineProperty(this, propertyKey, {
          value: debounce(originalMethod.bind(this), delay, immediate),
          configurable: true,
          enumerable: false,
          writable: true,
        });
      }

      // eslint-disable-next-line prefer-spread
      return self[propertyKey].apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Debounce function
 *
 * @example
 * ```ts
 * const debounced = debounce(() => console.log('debounced'), 200);
 * ```
 *
 * @param func the function to debounce
 * @param delay milliseconds after last invocation before execution happens
 * @param immediate if the function should be invoked on first call
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function debounce(func: Function, delay = 200, immediate = false) {
  let timerId: ReturnType<typeof setTimeout> | undefined = undefined;
  let lastCallTime: number | null = null;

  return function (this: any, ...args: any): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return new Promise((resolve) => {
      const now = Date.now();
      const callNow = immediate && !timerId;

      if (callNow) {
        lastCallTime = now;
        const result = func.apply(self, args);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        result instanceof Promise ? result.then((res) => resolve(res)) : resolve(result);
        timerId = setTimeout(() => {
          timerId = undefined;
        }, delay);
      } else {
        const elapsedTime = now - (lastCallTime || 0);
        if (lastCallTime && elapsedTime < delay) {
          clearTimeout(timerId);
        }
        lastCallTime = now;
        timerId = setTimeout(() => {
          timerId = undefined;
          if (!immediate) {
            const result = func.apply(self, args);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            result instanceof Promise ? result.then((res) => resolve(res)) : resolve(result);
          }
        }, delay);
      }
    });
  };
}
