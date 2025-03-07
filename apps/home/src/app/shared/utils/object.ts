/**
 * Give this function an array or an object, and it will merge each object in the array or each value in the object
 * with it's corresponding equal key. If no key can be determined, it will push the object as a new object onto the
 * return stack.
 *
 * @param comparables a list of source objects or arrays to merge
 */
export function deepMerge(...comparables: unknown[]): any {
  let acc = comparables[0];
  const sources = comparables.slice(1);
  for (const source of sources) {
    if (source instanceof Array) {
      // We are comparing arrays
      if (acc) {
        // Deep merge array
        deepMergeArray(acc as Array<unknown>, source);
      } else {
        // Accumulator is null. Overwrite with source
        acc = source;
      }
    } else if (source instanceof Object) {
      // We are comparing objects
      deepMergeObject(acc as Record<string, unknown>, source as Record<string, unknown>);
    }
  }

  // Return the merged object/array
  return acc;
}

/**
 * Deep merge arrays. This assumes that each source contains the same type of values and that the
 * indexes are comparable to each other.
 *
 * @param acc The stack to push merge to
 * @param source The array to merge in
 */
function deepMergeArray(acc: unknown[], source: unknown[]): unknown[] {
  // Find objects resembling each other and merge them.
  source.forEach((obj, i) => {
    if (i > acc.length - 1) {
      // This object does not exist on stack yet. Push it.
      acc.push(obj);
    } else {
      // Index exist. Merge it!
      acc[i] = deepMerge(acc[i], obj);
    }
  });
  return acc;
}

/**
 * Deep merge objects
 *
 * @param target The stack to push merge to
 * @param source The object to merge in
 */
function deepMergeObject(target: Record<string, unknown>, ...source: any[]): Record<string, unknown> {
  if (objToString(target) === objToString(source)) {
    // Objects are equal. Just return stack
    return target;
  }

  return (
    source
      // Merge all source keys together
      .reduce((acc, o) => acc.concat(Object.keys(o)), [])
      // ... with target keys
      .concat(Object.keys(target))
      // Remove duplicate keys
      .filter((k: string, i: number, arr: string[]) => arr.indexOf(k) === i)
      // Find values for each source key, overwriting target values if not null
      .forEach((k: string) => {
        target[k] = source.reduce((existingValue: any, sourceValue: any) => {
          if (
            sourceValue[k] != null &&
            existingValue != null &&
            typeof sourceValue[k] !== 'function' &&
            (sourceValue[k] instanceof Object || Array.isArray(sourceValue[k])) &&
            !sourceValue[k].constructor.name.includes('Subject')
          ) {
            // Value is Object/Array. Deep merge it.
            return deepMerge(existingValue, sourceValue[k]);
          }
          // Value is primitive. Overwrite if not null.
          return sourceValue[k] != null ? sourceValue[k] : existingValue;
        }, target[k]);
      })
  );
}

/**
 * Safely convert an object to a string. This will remove circular dependencies,
 * so the object might not be able to be converted back to a valid object.
 *
 * @param obj
 * @returns a string representation of the object
 *
 * @example
 * ```ts
 * objToString({ a: 1, b: { c: 2 } }) // '{"a":1,"b":{"c":2}}'
 * ```
 * @params str the string to convert
 * @returns the converted string
 */
export function objToString(obj: any): string {
  if (obj == null || typeof obj !== 'object') return '' + obj;
  return JSON.stringify(obj, refReplacer());
}

/**
 * Safely convert an object to a string. This will remove circular dependencies,
 * so the object might not be able to be converted back to a valid object.
 *
 * From https://stackoverflow.com/questions/10392293/stringify-convert-to-json-a-javascript-object-with-circular-reference/12659424
 */
function refReplacer() {
  const m = new Map();
  const v = new Map();
  let init: any = null;

  return function (this: any, field: any, value: any) {
    const self = this as any;
    const p = m.get(self) + (Array.isArray(self) ? `[${field}]` : '.' + field);
    const isComplex = value === Object(value);

    if (isComplex) m.set(value, p);

    const pp = v.get(value) || '';
    const path = p.replace(/undefined\.\.?/, '');
    let val = pp ? `#REF:${pp[0] == '[' ? '$' : '$.'}${pp}` : value;

    if (!init) init = value;
    else if (val === init) val = '#REF:$';

    if (!pp && isComplex) v.set(value, path);

    return val;
  };
}
