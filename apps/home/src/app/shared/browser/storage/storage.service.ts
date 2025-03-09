import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { deepMerge, objToString } from '../../utils/object';

const STORAGE_KEY = 'storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private window = globalThis.window || this.document.defaultView;

  // Our storage is a json object of unknown complexity and values
  private values: Record<string, unknown> = {};

  constructor() {
    // Load the storage from localStorage
    this.loadValues();
  }

  get length(): number {
    return this.getAllKeys().size;
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

  clear(): void {
    this.values = {};
    this.storeValues();
  }

  /**
   *
   * @param key A '.' separated path to the value
   * @returns The value
   */
  get(key: string): unknown | null {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided for "get".');
      return null;
    }

    const k = key.split('.').pop() as string;
    const obj = this.findKey(key, this.values);

    if (!obj || !(k in obj)) {
      return null;
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

    if (!obj || !(k in obj)) {
      console.warn(`Key "${key}" not found in storage. Nothing to remove.`);
      return;
    }

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

  private loadValues(): void {
    if (isPlatformBrowser(this.platformId)) {
      let valueStr = this.window.localStorage.getItem(STORAGE_KEY);

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
      this.window.localStorage.setItem(STORAGE_KEY, valueStr);
    }
  }

  private findKey(key: string, obj = this.values, level = 0): Record<string, unknown> | null {
    const path = key.split('.');
    if (path.length === 1) return obj;
    const child = obj[path.shift() as string] as Record<string, unknown>;
    return this.findKey(path.join('.'), child, level + 1);
  }
}
