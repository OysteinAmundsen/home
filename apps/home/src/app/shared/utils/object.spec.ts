import { deepMerge } from './object';

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
});
