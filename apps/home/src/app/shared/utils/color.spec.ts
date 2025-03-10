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
  strToHEX,
  strToHSL,
  strToRGB,
  toHexStr,
  toHslStr,
  toRgbStr,
} from './color';

describe('Color Utilities', () => {
  const colorHex = '#ff5733';
  const colorHexa = '#ff5733FF';
  const colorRgb = 'rgb(255, 87, 51)';
  const colorRgba = 'rgba(255, 87, 51, 1)';
  const colorHsl = 'hsl(10.59deg, 100%, 60%)';
  const colorHsla = 'hsl(10.59deg, 100%, 60%, 1)';

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
    expect(strToHEX(colorHex)).toEqual(['ff', '57', '33']);
    expect(strToHEX(colorHexa)).toEqual(['ff', '57', '33', 'ff']);
    expect(strToHEX(colorRgb)).toEqual(['ff', '57', '33']);
    expect(strToHEX(colorRgba)).toEqual(['ff', '57', '33', 'ff']);
    expect(strToHEX(colorHsl)).toEqual(['ff', '57', '33']);
    expect(strToHEX(colorHsla)).toEqual(['ff', '57', '33', 'ff']);
    expect(toHexStr(colorHex)).toBe(colorHex);
    expect(toHexStr(colorRgb)).toBe(colorHex);
    expect(toHexStr(colorHsl)).toBe(colorHex);
  });

  test('toRgb', () => {
    expect(strToRGB(colorHex)).toEqual([255, 87, 51]);
    expect(strToRGB(colorHexa)).toEqual([255, 87, 51, 1]);
    expect(strToRGB(colorRgb)).toEqual([255, 87, 51]);
    expect(strToRGB(colorRgba)).toEqual([255, 87, 51, 1]);
    expect(strToRGB(colorHsl)).toEqual([255, 87, 51]);
    expect(strToRGB(colorHsla)).toEqual([255, 87, 51, 1]);
    expect(toRgbStr(colorHex)).toBe(colorRgb);
    expect(toRgbStr(colorRgb)).toBe(colorRgb);
    expect(toRgbStr(colorHsl)).toBe(colorRgb);
  });

  test('toHsl', () => {
    expect(strToHSL(colorHex)).toEqual([10.59, 100, 60]);
    expect(strToHSL(colorHexa)).toEqual([10.59, 100, 60, 1]);
    expect(strToHSL(colorRgb)).toEqual([10.59, 100, 60]);
    expect(strToHSL(colorRgba)).toEqual([10.59, 100, 60, 1]);
    expect(strToHSL(colorHsl)).toEqual([10.59, 100, 60]);
    expect(strToHSL(colorHsla)).toEqual([10.59, 100, 60, 1]);
    expect(strToHSL('hsl(10.59deg, 100%, 60%, 100%)')).toEqual([10.59, 100, 60, 1]);
    expect(toHslStr(colorHex)).toEqual(colorHsl);
    expect(toHslStr(colorRgb)).toEqual(colorHsl);
    expect(toHslStr(colorHsl)).toEqual(colorHsl);
  });
});
