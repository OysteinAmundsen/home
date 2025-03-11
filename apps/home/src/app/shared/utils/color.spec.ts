import {
  addHue,
  convert,
  darken,
  destructure,
  Format,
  getAlpha,
  getHue,
  getLightness,
  getSaturation,
  lighten,
  setAlpha,
  setSaturation,
} from './color';

describe('Color Utilities', () => {
  const colorHex = '#ff5733';
  const colorHexa = '#ff5733FF';
  const colorRgb = 'rgb(255, 87, 51)';
  const colorRgba = 'rgba(255, 87, 51, 1)';
  const colorHsl = 'hsl(10.59, 100%, 60%)';
  const colorHsla = 'hsl(10.59, 100%, 60%, 1)';

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
    expect(destructure(colorHex, Format.HEX)).toEqual(['ff', '57', '33']);
    expect(destructure(colorHexa, Format.HEX)).toEqual(['ff', '57', '33', 'ff']);
    expect(destructure(colorRgb, Format.HEX)).toEqual(['ff', '57', '33']);
    expect(destructure(colorRgba, Format.HEX)).toEqual(['ff', '57', '33', 'ff']);
    expect(destructure(colorHsl, Format.HEX)).toEqual(['ff', '57', '33']);
    expect(destructure(colorHsla, Format.HEX)).toEqual(['ff', '57', '33', 'ff']);
    expect(convert(colorHex, Format.HEX)).toBe(colorHex);
    expect(convert(colorRgb, Format.HEX)).toBe(colorHex);
    expect(convert(colorHsl, Format.HEX)).toBe(colorHex);
  });

  test('toRgb', () => {
    expect(destructure(colorHex, Format.RGB)).toEqual([255, 87, 51]);
    expect(destructure(colorHexa, Format.RGB)).toEqual([255, 87, 51, 1]);
    expect(destructure(colorRgb, Format.RGB)).toEqual([255, 87, 51]);
    expect(destructure(colorRgba, Format.RGB)).toEqual([255, 87, 51, 1]);
    expect(destructure(colorHsl, Format.RGB)).toEqual([255, 87, 51]);
    expect(destructure(colorHsla, Format.RGB)).toEqual([255, 87, 51, 1]);
    expect(convert(colorHex, Format.RGB)).toBe(colorRgb);
    expect(convert(colorRgb, Format.RGB)).toBe(colorRgb);
    expect(convert(colorHsl, Format.RGB)).toBe(colorRgb);
  });

  test('toHsl', () => {
    expect(destructure(colorHex, Format.HSL)).toEqual([10.59, 100, 60]);
    expect(destructure(colorHexa, Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(destructure(colorRgb, Format.HSL)).toEqual([10.59, 100, 60]);
    expect(destructure(colorRgba, Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(destructure(colorHsl, Format.HSL)).toEqual([10.59, 100, 60]);
    expect(destructure(colorHsla, Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(destructure('hsl(10.59deg, 100%, 60%, 100%)', Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(convert(colorHex, Format.HSL)).toEqual(colorHsl);
    expect(convert(colorRgb, Format.HSL)).toEqual(colorHsl);
    expect(convert(colorHsl, Format.HSL)).toEqual(colorHsl);
  });
});
