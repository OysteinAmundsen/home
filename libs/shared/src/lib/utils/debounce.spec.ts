import { debounce } from './debounce';

describe('debounce', () => {
  jest.useFakeTimers();

  it('should debounce all calls except last', () => {
    let callCount = 0;
    const debounceFn = debounce(() => callCount++, 200, false);
    for (let j = 0; j < 100; j++) {
      debounceFn();
      jest.advanceTimersByTime(100);
    }
    expect(callCount).toBe(0);
    jest.advanceTimersByTime(300);
    expect(callCount).toBe(1);
  });

  it('should not debounce any calls when they are far enough apart', () => {
    let callCount = 0;
    const debounceFn = debounce(() => callCount++, 99, false);
    for (let j = 0; j < 100; j++) {
      debounceFn();
      jest.advanceTimersByTime(100);
    }
    expect(callCount).toBe(100);
  });

  it('should disregard all subsequent calls if set to invoke immediately', () => {
    let callCount = 0;
    const debounceFn = debounce(() => callCount++, 200, true);
    for (let j = 0; j < 100; j++) {
      debounceFn();
      jest.advanceTimersByTime(100);
    }
    expect(callCount).toBe(1);
  });
});
