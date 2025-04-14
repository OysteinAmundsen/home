import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { deepMerge, objToString } from '../../utils/object';

const STORAGE_KEY = 'storage';

const storage = new Map<string, string>();
const storageMock = {
  getItem: (key: string): string | null => {
    return storage.has(key) ? (storage.get(key) as string) : null;
  },
  removeItem: (key: string) => {
    return storage.delete(key);
  },
  setItem: (key: string, value: string) => {
    return storage.set(key, value);
  },
  length: storage.size,
  clear: () => storage.clear(),
  key: (idx) => [...storage.keys()][idx],
} as Storage;

export function getLocalStorage(document: Document): Storage {
  const window = globalThis.window || document.defaultView;
  try {
    return window.self.localStorage;
  } catch (ex) {
    // Could not get localStorage. Use memory storage instead.
    return storageMock;
  }
}

const shouldEncode = true;

/**
 * A service that provides a simple key-value store using the browser's localStorage.
 *
 * Whereas normal  operations against localStorage would operate on single string values,
 * this service allows you to store complex objects and values. The internal storage is a
 * regular JSON object. It will serialize to a string and placed in localStorage upon change,
 * and it will deserialize from localStorage upon instantiation.
 *
 * The service uses a similar api to the regular Storage interface, but it allows for nested
 * keys and values. So you can store and retrieve values like this:
 *
 * ```ts
 * storage.set('user.name', 'John Doe');
 * storage.get('user.name'); // 'John Doe'
 * ```
 *
 * Internally this value is represented as `{ user: { name: 'John Doe' } }`.
 *
 * When serialized to localStorage, all the values in the internal storage will be
 * stringified, uri encoded and base64 encoded. This is to prevent issues with special
 * characters and to make the storage more resilient to tampering.
 *
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private storage: Storage = getLocalStorage(this.document);

  // Our storage is a json object of unknown complexity and values
  private values: Record<string, unknown> = {};

  constructor() {
    // Load the storage from localStorage
    this.loadValues();
  }

  clear(): void {
    this.values = {};
    this.storeValues();
  }

  /**
   *
   * @param key A '.' separated path to the value
   * @returns The value
   */
  get(key: string, defaultValue?: unknown): unknown | null {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided for "get".');
      return null;
    }

    const k = key.split('.').pop() as string;
    const obj = this.findKey(key, this.values);

    if (!obj || !(k in obj)) {
      return defaultValue ?? null;
    }
    return obj[k];
  }

  /**
   *
   * @param key A '.' separated path to the value
   */
  remove(key: string): void {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided for "remove".');
      return;
    }

    const k = key.split('.').pop() as string;
    const obj = this.findKey(key, this.values);

    if (!obj || !(k in obj)) return;

    delete obj[k];
    this.storeValues();
  }

  /**
   *
   * @param key A '.' separated path to the value
   * @param value
   */
  set(key: string, value: unknown): void {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided for "set".');
      return;
    }

    if (value === undefined || value === null) {
      console.error('Invalid value provided for "set". Cannot store null or undefined.');
      return;
    }

    const path = key.split('.');
    const k = path.pop() as string;

    // Iterate through the path and create missing objects as needed
    let current = this.values;
    path.forEach((segment) => {
      if (!(segment in current) || typeof current[segment] !== 'object' || current[segment] === null) {
        current[segment] = {}; // Create a new object if the segment doesn't exist
      }
      current = current[segment] as Record<string, unknown>;
    });
    const obj = this.findKey(key, this.values);
    if (obj != null && k in obj && obj[k] === value) {
      // Value is the same. No need to store it again.
      return;
    }
    if (obj != null && Array.isArray(obj[k])) {
      // Do not merge arrays. Replace them.
      obj[k] = [];
    }

    if (obj != null) {
      if (k in obj) {
        deepMerge(obj, { [k]: value });
      } else {
        obj[k] = value;
      }
      this.storeValues();
    } else {
      console.error(`Failed to resolve key path for "${key}".`);
    }
  }

  flatten() {
    const keys = this.getAllKeys();
    const flat = new Map<string, unknown>();
    keys.forEach((key) => flat.set(key, this.get(key)));
    return flat;
  }

  get length(): number {
    return this.getAllKeys().size;
  }

  loadValues(): void {
    if (isPlatformBrowser(this.platformId)) {
      let valueStr = this.storage.getItem(STORAGE_KEY);

      // Decode the stored values
      if (valueStr && !valueStr.startsWith('{')) {
        valueStr = atob(valueStr || '');
        valueStr = decodeURIComponent(valueStr);
      }
      this.values = JSON.parse(valueStr || '{}') as Record<string, unknown>;
    }
  }

  private storeValues(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Encode the values before storing
      let valueStr = objToString(this.values);
      valueStr = encodeURIComponent(valueStr);
      valueStr = btoa(valueStr);
      this.storage.setItem(STORAGE_KEY, valueStr);
    }
  }

  private getAllKeys(obj: Record<string, unknown> = this.values, parentPath = ''): Set<string> {
    const keys = new Set<string>();

    Object.keys(obj).forEach((key) => {
      const fullPath = parentPath ? `${parentPath}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively get keys for nested objects
        const nestedKeys = this.getAllKeys(obj[key] as Record<string, unknown>, fullPath);
        nestedKeys.forEach((nestedKey) => keys.add(nestedKey));
      } else {
        // Add the full path for non-object values
        keys.add(fullPath);
      }
    });

    return keys;
  }

  private findKey(key: string, obj = this.values, level = 0): Record<string, unknown> | null {
    const path = key.split('.');
    if (path.length === 1) return obj;
    const child = obj[path.shift() as string] as Record<string, unknown>;
    return this.findKey(path.join('.'), child, level + 1);
  }
}
