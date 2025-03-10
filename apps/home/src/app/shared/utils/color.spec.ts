import { Color, Format } from './color';

describe('Color Utilities', () => {
  const colorHex = '#ff5733';
  const colorHexa = '#ff5733FF';
  const colorRgb = 'rgb(255, 87, 51)';
  const colorRgba = 'rgba(255, 87, 51, 1)';
  const colorHsl = 'hsl(10.59, 100%, 60%)';
  const colorHsla = 'hsl(10.59, 100%, 60%, 1)';

  test('getHue', () => {
    expect(Color.getHue(colorHsl)).toBe(10.59);
  });

  test('addHue', () => {
    expect(Color.addHue(colorHsl, 10)).toBe('hsl(20.59, 100%, 60%)');
  });

  test('getSaturation', () => {
    expect(Color.getSaturation(colorHsl)).toBe(100);
  });

  test('setSaturation', () => {
    expect(Color.setSaturation(colorHsl, 50)).toBe('hsl(10.59, 50%, 60%)');
  });

  test('getLightness', () => {
    expect(Color.getLightness(colorHsl)).toBe(60);
  });

  test('getAlpha', () => {
    expect(Color.getAlpha(colorHsl)).toBe(255);
  });

  test('setAlpha', () => {
    expect(Color.setAlpha(colorHsl, 0.5)).toBe('hsla(10.59, 100%, 60%, 50%)');
  });

  test('lighten', () => {
    expect(Color.lighten(colorHsl, 10)).toBe('hsl(10.59, 100%, 70%)');
  });

  test('darken', () => {
    expect(Color.darken(colorHsl, 10)).toBe('hsl(10.59, 100%, 50%)');
  });

  test('toHex', () => {
    expect(Color.destructure(colorHex, Format.HEX)).toEqual(['ff', '57', '33']);
    expect(Color.destructure(colorHexa, Format.HEX)).toEqual(['ff', '57', '33', 'ff']);
    expect(Color.destructure(colorRgb, Format.HEX)).toEqual(['ff', '57', '33']);
    expect(Color.destructure(colorRgba, Format.HEX)).toEqual(['ff', '57', '33', 'ff']);
    expect(Color.destructure(colorHsl, Format.HEX)).toEqual(['ff', '57', '33']);
    expect(Color.destructure(colorHsla, Format.HEX)).toEqual(['ff', '57', '33', 'ff']);
    expect(Color.convert(colorHex, Format.HEX)).toBe(colorHex);
    expect(Color.convert(colorRgb, Format.HEX)).toBe(colorHex);
    expect(Color.convert(colorHsl, Format.HEX)).toBe(colorHex);
  });

  test('toRgb', () => {
    expect(Color.destructure(colorHex, Format.RGB)).toEqual([255, 87, 51]);
    expect(Color.destructure(colorHexa, Format.RGB)).toEqual([255, 87, 51, 1]);
    expect(Color.destructure(colorRgb, Format.RGB)).toEqual([255, 87, 51]);
    expect(Color.destructure(colorRgba, Format.RGB)).toEqual([255, 87, 51, 1]);
    expect(Color.destructure(colorHsl, Format.RGB)).toEqual([255, 87, 51]);
    expect(Color.destructure(colorHsla, Format.RGB)).toEqual([255, 87, 51, 1]);
    expect(Color.convert(colorHex, Format.RGB)).toBe(colorRgb);
    expect(Color.convert(colorRgb, Format.RGB)).toBe(colorRgb);
    expect(Color.convert(colorHsl, Format.RGB)).toBe(colorRgb);
  });

  test('toHsl', () => {
    expect(Color.destructure(colorHex, Format.HSL)).toEqual([10.59, 100, 60]);
    expect(Color.destructure(colorHexa, Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(Color.destructure(colorRgb, Format.HSL)).toEqual([10.59, 100, 60]);
    expect(Color.destructure(colorRgba, Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(Color.destructure(colorHsl, Format.HSL)).toEqual([10.59, 100, 60]);
    expect(Color.destructure(colorHsla, Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(Color.destructure('hsl(10.59deg, 100%, 60%, 100%)', Format.HSL)).toEqual([10.59, 100, 60, 1]);
    expect(Color.convert(colorHex, Format.HSL)).toEqual(colorHsl);
    expect(Color.convert(colorRgb, Format.HSL)).toEqual(colorHsl);
    expect(Color.convert(colorHsl, Format.HSL)).toEqual(colorHsl);
  });
});
