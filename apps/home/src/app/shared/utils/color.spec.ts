import {
  addHue,
  darken,
  getAlpha,
  getHue,
  getLightness,
  getSaturation,
  lighten,
  setAlpha,
  setSaturation,
  toHex,
  toHsl,
  toRgb,
} from './color';

describe('Color Utilities', () => {
  const colorHex = '#ff5733';
  const colorRgb = 'rgb(255, 87, 51)';
  const colorHsl = 'hsl(10.59deg, 100%, 60%)';

  test('getHue', () => {
    expect(getHue(colorHsl)).toBe(10.59);
  });

  test('addHue', () => {
    expect(addHue(colorHsl, 10)).toBe('hsl(20.59, 100%, 60%)');
  });

  test('getSaturation', () => {
    expect(getSaturation(colorHsl)).toBe(100);
  });

  test('setSaturation', () => {
    expect(setSaturation(colorHsl, 50)).toBe('hsl(10.59, 50%, 60%)');
  });

  test('getLightness', () => {
    expect(getLightness(colorHsl)).toBe(60);
  });

  test('getAlpha', () => {
    expect(getAlpha(colorHsl)).toBe(255);
  });

  test('setAlpha', () => {
    expect(setAlpha(colorHsl, 0.5)).toBe('hsla(10.59, 100%, 60%, 50%)');
  });

  test('lighten', () => {
    expect(lighten(colorHsl, 10)).toBe('hsl(10.59, 100%, 70%)');
  });

  test('darken', () => {
    expect(darken(colorHsl, 10)).toBe('hsl(10.59, 100%, 50%)');
  });

  test('toHex', () => {
    expect(toHex(colorRgb)).toBe(colorHex);
    expect(toHex(colorHsl)).toBe(colorHex);
  });

  test('toRgb', () => {
    expect(toRgb(colorHex)).toBe(colorRgb);
    expect(toRgb(colorHsl)).toBe(colorRgb);
  });

  test('toHsl', () => {
    expect(toHsl(colorHex)).toEqual([10.59, 100, 60]);
    expect(toHsl(colorRgb)).toEqual([10.59, 100, 60]);
  });
});
