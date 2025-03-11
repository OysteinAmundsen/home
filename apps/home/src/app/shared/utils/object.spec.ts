import { deepMerge, objToString } from './object';

describe('deepMerge', () => {
  it('should be able to merge simple objects', () => {
    expect(deepMerge({ a: 'test' }, { a: 'test2' })).toEqual({ a: 'test2' });
  });

  it('should be able to merge more complex objects', () => {
    const obj1 = { a: 'test', b: 1, c: [] };
    const obj2 = { d: 24, c: [1, 2, 3] };
    const merged = deepMerge(obj1, obj2);
    expect(merged).toEqual({ a: 'test', b: 1, c: [1, 2, 3], d: 24 });
    expect(merged).toEqual(obj1);
  });

  it('should be able to merge arrays', () => {
    const arr1 = [{ a: 'test', b: 1, c: [] }];
    const arr2 = [{ d: 24, c: [1, 2, 3] }];
    const merged = deepMerge(arr1, arr2);
    expect(merged).toEqual([{ a: 'test', b: 1, c: [1, 2, 3], d: 24 }]);
    expect(merged).toEqual(arr1);
  });

  it('should convert object to a string', () => {
    expect(objToString({})).toEqual('{}');
    expect(objToString({ a: 1, b: 2 })).toEqual('{"a":1,"b":2}');
  });
  it('should truncate circular dependencies', () => {
    const a: any = { a: 1, b: 2 };
    const b: any = { a, b: 2 };
    a.c = b;
    expect(objToString(a)).toEqual('{"a":1,"b":2,"c":{"a":"#REF:$","b":2}}');
  });
});
