import { logMsg } from '../browser/logger/logger';

// We currently support the following color types
export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];
export type RGBOrRGBA = RGB | RGBA;

export type HSL = [number, number, number];
export type HSLA = [number, number, number, number];
export type HSLOrHSLA = HSL | HSLA;

export type HEX = [string, string, string];
export type HEXA = [string, string, string, string];
export type HEXOrHEXA = HEX | HEXA;

export type RGBFloat = [number, number, number, number];

export enum Format {
  HEX = 'hex',
  RGB = 'rgb',
  HSL = 'hsl',
  FLOAT = 'float',
}

// #region Color manipulation
/**
 * Return the hue of any color value
 *
 * @example
 * ```ts
 * getHue('rgb(255, 255, 255)'); // => 0
 * getHue('rgba(255, 255, 255, 1)'); // => 0
 * getHue('hsl(255, 100%, 100%)'); // => 255
 * getHue('hsla(255, 100%, 100%, 1)'); // => 255
 * getHue('#FFFFFF'); // => 0
 * ```
 * @param color the color value to get the hue from
 * @returns the hue value
 */
export function getHue(color: string): number {
  const [h, s, l, a] = strToHSL(color);
  return h;
}

/**
 * Convert to HSLA and add the given percentage to the Hue.
 * Color will be returned in the format given (hex, rgb, hsl)
 *
 * @example
 * ```ts
 * addHue('rgb(204, 238, 255)', 10); // => 'rgb(204, 229, 255)'
 * addHue('hsl(200, 100%, 90%)', 10); // => 'hsl(210, 100%, 90%)'
 * addHue('#cceeff', 10); // => '#cce5ff'
 * ```
 * @param color the color value to add the hue to
 * @param degrees the degrees to add to the hue
 * @returns the new color value
 */
export function addHue(color: string, degrees: number): string {
  const [h, s, l, a] = strToHSL(color);
  return calculate(color, h + degrees > 360 ? h + degrees - 360 : h + degrees, s, l, a);
}

/**
 * Convert to HSLA and add the given percentage to the Hue.
 * Color will be returned in the format given (hex, rgb, hsl)
 *
 * @example
 * ```ts
 * addHue('rgb(204, 238, 255)', 10); // => 'rgb(204, 229, 255)'
 * addHue('hsl(200, 100%, 90%)', 10); // => 'hsl(210, 100%, 90%)'
 * addHue('#cceeff', 10); // => '#cce5ff'
 * ```
 * @param color the color value to add the hue to
 * @param hue the hue to set
 * @returns the new color value
 */
export function setHue(color: string, hue: number): string {
  const [h, s, l, a] = strToHSL(color);
  return calculate(color, hue, s, l, a);
}

/**
 * Return the saturation of any color value
 *
 * @example
 * ```ts
 * getSaturation('rgb(255, 255, 255)'); // => 255
 * getSaturation('rgba(255, 255, 255, 1)'); // => 255
 * getSaturation('hsl(255, 100%, 100%)'); // => 255
 * getSaturation('hsla(255, 100%, 100%, 1)'); // => 255
 * getSaturation('#FFFFFF'); // => 255
 * ```
 * @param color the color value to get the saturation from
 * @returns the saturation value
 */
export function getSaturation(color: string): number {
  const [h, s, l, a] = strToHSL(color);
  return s;
}

/**
 * Convert to HSLA and rewrite the Saturation with the given percentage.
 * Color will be returned in the format given (hex, rgb, hsl)
 *
 * @example
 * ```ts
 * setSaturation('rgb(204, 238, 255)', 50); // => 'rgb(204, 238, 255)'
 * setSaturation('hsl(200, 100%, 90%)', 50); // => 'hsl(200, 50%, 90%)'
 * setSaturation('#cceeff', 50); // => '#cceeff'
 * ```
 * @param color the color value to set the saturation to
 * @param percent the percentage to set the saturation to
 * @returns the new color value
 */
export function setSaturation(color: string, percent: number): string {
  const [h, s, l, a] = strToHSL(color);
  return calculate(color, h, percent, l, a);
}

/**
 * Return the lightness of any color value
 *
 * @example
 * ```ts
 * getLightness('rgb(255, 255, 255)'); // => 255
 * getLightness('rgba(255, 255, 255, 1)'); // => 255
 * getLightness('hsl(255, 100%, 100%)'); // => 255
 * getLightness('hsla(255, 100%, 100%, 1)'); // => 255
 * getLightness('#FFFFFF'); // => 255
 * ```
 * @param color the color value to get the lightness from
 * @returns the lightness value
 */
export function getLightness(color: string): number {
  const [h, s, l, a] = strToHSL(color);
  return l;
}

/**
 * Set the lightness of any color value
 *
 * @example
 * ```ts
 * setLightness('rgb(255, 255, 255)', 0); // => 'rgb(0, 0, 0)'
 * setLightness('rgba(255, 255, 255, 1)', 0); // => 'rgba(0, 0, 0, 1)'
 * setLightness('hsl(255, 100%, 100%)', 0); // => 'hsl(255, 255%, 0%)'
 * setLightness('hsla(255deg, 255%, 255%, 100%)', 0); // => 'hsla(255deg, 255%, 0%, 100%)'
 * setLightness('#FFFFFF', 0); // => '#000000'
 * ```
 * @param color the color value to set the lightness to
 * @param lightness the lightness value to set
 * @returns the new color value
 */
export function setLightness(color: string, lightness: number): string {
  const [h, s, l, a] = strToHSL(color);
  return calculate(color, h, s, lightness, a);
}

/**
 * Convert to HSLA and add the given percentage to the Lightness
 * Color will be returned in the format given (hex, rgb, hsl)
 *
 * @example
 * ```ts
 * lighten('rgb(204, 238, 255)', 10); // => 'rgb(229, 243, 255)'
 * lighten('hsl(200, 100%, 90%)', 10); // => 'hsl(200, 100%, 100%)'
 * lighten('#cceeff', 10); // => '#e0f4ff'
 * ```
 * @param color the color value to lighten
 * @param percent the percentage to lighten the color
 * @returns the new color value
 */
export function lighten(color: string, percent: number): string {
  const [h, s, l, a] = strToHSL(color);
  return calculate(color, h, s, l + percent > 100 ? 100 : l + percent, a);
}
/**
 * Convert to HSLA and subtract the given percentage to the Lightness
 * Color will be returned in the format given (hex, rgb, hsl)
 *
 * @example
 * ```ts
 * darken('rgb(204, 238, 255)', 10); // => 'rgb(179, 233, 255)'
 * darken('hsl(200, 100%, 90%)', 10); // => 'hsl(200, 100%, 80%)'
 * darken('#cceeff', 10); // => '#b3d9ff'
 * ```
 * @param color the color value to darken
 * @param percent the percentage to darken the color
 * @returns the new color value
 */
export function darken(color: string, percent: number): string {
  const [h, s, l, a] = strToHSL(color);
  return calculate(color, h, s, l - percent < 0 ? 0 : l - percent, a);
}

/**
 * Return the alpha value of any color value
 *
 * @example
 * ```ts
 * getAlpha('rgb(255, 255, 255)'); // => 255
 * getAlpha('rgba(255, 255, 255, 1)'); // => 255
 * getAlpha('hsl(255, 100%, 100%)'); // => 255
 * getAlpha('hsla(255, 100%, 100%, 1)'); // => 255
 * getAlpha('#FFFFFF'); // => 255
 * ```
 * @param color the color value to get the alpha from
 * @returns the alpha value
 */
export function getAlpha(color: string): number {
  const [h, s, l, a] = strToHSL(color);
  return a != null ? a : 255;
}

/**
 * Set the alpha value of any color value
 *
 * @example
 * ```ts
 * setAlpha('rgb(255, 255, 255)', 0.5); // => 'rgba(255, 255, 255, 0.5)'
 * setAlpha('rgba(255, 255, 255, 1)', 0.5); // => 'rgba(255, 255, 255, 0.5)'
 * setAlpha('hsl(255, 100%, 100%)', 0.5); // => 'hsla(255, 100%, 100%, 0.5)'
 * setAlpha('hsla(255, 100%, 100%, 1)', 0.5); // => 'hsla(255, 100%, 100%, 0.5)'
 * setAlpha('#FFFFFF', 0.5); // => '#FFFFFF80'
 * ```
 * @param color the color value to set the alpha to
 * @param alpha the alpha value to set
 * @returns the new color value
 */
export function setAlpha(color: string, alpha: number): string {
  const [h, s, l] = strToHSL(color);
  return calculate(color, h, s, l, alpha);
}

/**
 * Calculate the contrast ratio between two colors.
 *
 * The contrast ratio is a measure of the difference in luminance
 * between two colors, which is important for ensuring text
 * readability and accessibility.
 *
 * @example
 * ```ts
 * contrastRatio('#FFFFFF', '#000000'); // => 21
 * contrastRatio('#FFFFFF', '#FFFFFF'); // => 1
 * contrastRatio('#FFFFFF', '#FF5733'); // => 1.23
 * ```
 *
 * @param col1 the primary color to compare
 * @param col2 the secondary color to compare
 * @returns the contrast ratio between the two colors
 */
export function contrastRatio(col1: string, col2 = '#000000'): number {
  const [r1, g1, b1, a1 = 1] = strToRGB(col1);
  const [r2, g2, b2, a2 = 1] = strToRGB(col2);

  // Blend colors with white background
  // This takes color opacity into account
  const [r1b, g1b, b1b] = blendWithWhite(r1, g1, b1, a1);
  const [r2b, g2b, b2b] = blendWithWhite(r2, g2, b2, a2);

  const l1 = luminance(r1b, g1b, b1b); // relative luminance of col1
  const l2 = luminance(r2b, g2b, b2b); // relative luminance of col2

  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function blendWithWhite(...color: RGBA): RGB;
function blendWithWhite(r: number, g: number, b: number, alpha: number): RGB {
  const blend = (color: number) => color * alpha + 255 * (1 - alpha);
  return [blend(r), blend(g), blend(b)];
}

function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Get the calculated css property from the DOM
 *
 * Useful for retreiving calculated css variables.
 *
 * NOTE: Do not use this in SSR environments. It heavily relies on the DOM.
 *
 * @example
 * ```ts
 * getComputedStyle(document.body, 'background-color'); // => 'rgb(255, 255, 255)'
 * ```
 * @param element the base elemenent to get the property from
 * @param property the css property to get
 * @returns the computed css property
 */
export function getComputedStyle(element: HTMLElement): CSSStyleDeclaration;
export function getComputedStyle(element: HTMLElement, property: string): string;
export function getComputedStyle(
  element: HTMLElement,
  property?: string,
  type = 'color',
): string | CSSStyleDeclaration {
  try {
    const document = element.ownerDocument;
    const window = document.defaultView;
    if (!window) throw new Error('Window not found');

    if (property) {
      if (property.startsWith('--') && type === 'color') {
        // Get computed color from css variable
        const tmp = document.createElement('div');
        tmp.style.setProperty(type, `var(${property})`);
        document.body.appendChild(tmp);
        const style = window.getComputedStyle(tmp).getPropertyValue(type);
        document.body.removeChild(tmp);
        return style;
      }
      return window.getComputedStyle(element).getPropertyValue(property);
    } else {
      return window.getComputedStyle(element);
    }
  } catch (error) {
    console.error(...logMsg('error', 'Color', 'Error getting computed style', error));
    return '';
  }
}

// --------------------------------------------------------------------
// #region Conversion functions
//
// Converts between different color formats
// --------------------------------------------------------------------
/**
 * Takes a color string and returns an array of values in the given format
 *
 * This currently only supports HEX, RGB, HSL and vec4f FLOAT formats.
 *
 * @example
 * ```ts
 * destructure('rgb(255, 87, 51)', Format.HEX); // => ['ff', '57', '33']
 * destructure('rgba(255, 87, 51, 1)', Format.HSL); // => [11, 100, 60, 1]
 * destructure('hsl(10.59, 100%, 60%)', Format.RGB); // => ['255', '87', '51']
 * ```
 *
 * @param color The color string to destructure
 * @param to The format to destructure to
 * @returns The destrucutred color
 */
export function destructure(color: string, to: Format.HEX): HEXOrHEXA;
export function destructure(color: string, to: Format.RGB): RGBOrRGBA;
export function destructure(color: string, to: Format.HSL): HSLOrHSLA;
export function destructure(color: string, to: Format.FLOAT): RGBA;
export function destructure(color: string, to: Format): RGBOrRGBA | HSLOrHSLA | HEXOrHEXA {
  switch (to) {
    case Format.HEX:
      return strToHEX(color) as HEXOrHEXA;
    case Format.RGB:
      return strToRGB(color) as RGBOrRGBA;
    case Format.HSL:
      return strToHSL(color) as HSLOrHSLA;
    case Format.FLOAT:
      return RGBToFloat(...strToRGB(color)) as RGBA;
    default:
      throw new Error('Invalid color format');
  }
}

/**
 * Converts a color code from one format to another
 *
 * This currently only supports HEX, RGB, HSL formats.
 *
 * @example
 * ```ts
 * convert('rgb(255, 87, 51)', Format.HEX); // => '#FF5733'
 * convert('hsl(10.59, 100%, 60%)', Format.RGB); // => 'rgb(255, 87, 51)'
 * convert('#FF5733', Format.HSL); // => 'hsl(10.59, 100%, 60%)'
 * ```
 * @param color The color code to convert
 * @param to The format to convert to
 * @returns The formatted color string
 */
export function convert(color: string, to: Format): string {
  switch (to) {
    case Format.HEX:
      return toHexStr(color);
    case Format.RGB:
      return toRgbStr(color);
    case Format.HSL:
      return toHslStr(color);
    case Format.FLOAT:
      // Not very useful to convert to float as a string, but the `Format` enum
      // specifies this format, so we have to return something.
      return JSON.stringify(RGBToFloat(...strToRGB(color)));
    default:
      throw new Error('Invalid color format');
  }
}

/**
 * Convert any color string to hex css color string. Accepts alpha values.
 *
 * @example
 * ```ts
 * toHexStr('rgb(255, 255, 255)'); // => '#FFFFFF'
 * toHexStr('hsl(255, 100%, 100%)'); // => '#FFFFFF'
 * toHexStr('#FFFFFF'); // => '#FFFFFF'
 * ```
 */
function toHexStr(color: string): string {
  return `#${strToHEX(color).join('')}`;
}

function strToHEX(color: string): HEXOrHEXA {
  return RGBtoHEX(...strToRGB(color)) as HEXOrHEXA;
}

/**
 * Convert any color string to hex values. Accepts alpha values.
 */
function RGBtoHEX(...color: RGBOrRGBA): HEXOrHEXA;
function RGBtoHEX(r: number, g: number, b: number, a?: number): HEXOrHEXA {
  const [rh, gh, bh] = [r, g, b].map((x) => x.toString(16).padStart(2, '0')) as HEX;
  if (a != null) return [rh, gh, bh, alphaToHex(a)] as HEXA;
  return [rh, gh, bh] as HEX;
}
function alphaToHex(a: number): string {
  return Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
}

/**
 * Convert any color string to an rgb color css string. Accepts alpha values.
 *
 * @example
 * ```ts
 * toRgbStr('rgb(255, 255, 255)'); // => 'rgb(255, 255, 255)'
 * toRgbStr('hsl(255, 100%, 100%)'); // => 'rgb(255, 255, 255)'
 * toRgbStr('#FFFFFF'); // => 'rgb(255, 255, 255)'
 * ```
 */
function toRgbStr(color: string): string {
  const col = strToRGB(color);
  return `rgb${col.length > 3 ? 'a' : ''}(${col.join(', ')})`;
}

/**
 * Convert any color string to RGB values. Will also accept alpha if present.
 *
 * @example
 * ```ts
 * toRGB('#FFFFFF'); // => [255, 255, 255]
 * toRGB('rgb(255, 255, 255)'); // => [255, 255, 255]
 * toRGB('hsl(255, 100%, 100%)'); // => [255, 255, 255]
 * toRGB('rgba(255, 255, 255, 1)'); // => [255, 255, 255, 1]
 * toRGB('hsla(255, 100%, 100%, 1)'); // => [255, 255, 255, 1]
 * ```
 */
function strToRGB(color: string): RGBOrRGBA {
  if (color.startsWith('#')) {
    // Hexadecimal color input
    const [r, g, b, a] = color
      .replace(
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i,
        (m, r, g, b, a) => '#' + r + g + b + (a ? a : ''),
      )
      .substring(1)
      .match(/.{2}/g)
      ?.map((x: string) => parseInt(x, 16)) as RGBOrRGBA;
    if (a) return [r, g, b, parseInt(`${a}`) / 255] as RGBA;
    return [r, g, b] as RGB;
  } else if (color.startsWith('rgb')) {
    // RGB color input
    return color
      .substring(color.indexOf('(') + 1, color.indexOf(')'))
      .split(',')
      .map((n) => {
        // Convert to float if percentage is set
        if (n.indexOf('%') > -1) return parseInt(n) / 100;
        return +n;
      }) as RGBOrRGBA;
  } else if (color.startsWith('hsl')) {
    // HSL color input
    const [h, s, l, a] = color
      .substring(color.indexOf('(') + 1, color.indexOf(')'))
      .split(',')
      .map((n, i) => {
        if (i === 3 && n.indexOf('%') > -1) return parseInt(n.replace('%', '')) / 100;
        return +n.replace('%', '').replace('deg', '').trim();
      });
    return HSLToRGB(h, s, l, a);
  } else if (color.startsWith('color(srgb')) {
    // sRGB color input
    return color
      .substring(color.indexOf('(srgb') + 6, color.indexOf(')'))
      .split(' ')
      .map((n) => +n * 255) as RGBOrRGBA;
  }
  throw new Error('Invalid color string');
}

/**
 * Convert color values to floats.
 *
 * Useful when working with WebGL/WebGPU where color values has to be given in vector floats.
 *
 * @param color the RGB or RGBA color values to convert
 * @returns
 */
function RGBToFloat(...color: RGBOrRGBA): RGBFloat;
function RGBToFloat(r: number, g: number, b: number, a?: number): RGBFloat {
  return [r / 255, g / 255, b / 255, a != null ? a : 1];
}
/** Utility to premultiply alpha to color floats.  */
export function premultiplyAlpha(color: string | RGBFloat): RGBFloat {
  if (typeof color === 'string') color = destructure(color, Format.FLOAT) as RGBFloat;
  const alpha = color[3];
  return color.map((c, i) => (i === 3 ? alpha : c * alpha)) as RGBFloat;
}

function HSLToRGB(...color: HSLOrHSLA): RGBOrRGBA;
function HSLToRGB(h: number, s: number, l: number, a?: number): RGBOrRGBA {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  // prettier-ignore
  let r = 0, g = 0, b = 0;

  // prettier-ignore
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return a != null ? ([r, g, b, a] as RGBA) : ([r, g, b] as RGB);
}
/**
 * Convert any color string to hsl.
 * Accepts alpha values.
 *
 * @example
 * ```ts
 * toHslString('rgb(255, 255, 255)'); // => hsl(0, 0%, 100%)
 * toHslString('hsl(255, 100%, 100%)'); // => hsl(255, 100%, 100%)
 * toHslString('#FFFFFF'); // => hsl(0, 0%, 100%)
 * ```
 */
function toHslStr(color: string) {
  const [h, s, l, a] = strToHSL(color);
  return `hsl${a != null && a > -1 ? 'a' : ''}(${toFixed(h, 2).replace('.00', '')}, ${toFixed(s, 3).replace('.000', '')}%, ${toFixed(l, 3).replace('.000', '')}%${
    a != null && a > -1 ? ', ' + a + '%' : ''
  })`;
}

/**
 * Convert any color string to hsl.
 * Accepts alpha values.
 *
 * @example
 * ```ts
 * toHsl('rgb(255, 255, 255)'); // => [0, 0, 100]
 * toHsl('hsl(255, 100%, 100%)'); // => [255, 255, 255]
 * toHsl('#FFFFFF'); // => [0, 0, 100]
 * ```
 */
function strToHSL(color: string): HSLOrHSLA {
  return RGBToHSL(...strToRGB(color));
}

function RGBToHSL(...color: RGBOrRGBA): HSLOrHSLA;
function RGBToHSL(r: number, g: number, b: number, a?: number): HSLOrHSLA {
  r /= 255;
  g /= 255;
  b /= 255;

  const cMin = Math.min(r, g, b);
  const cMax = Math.max(r, g, b);
  const delta = cMax - cMin;

  let h = 0;
  if (delta !== 0) {
    if (cMax === r) {
      // Red is max
      h = ((g - b) / delta) % 6;
    } else if (cMax === g) {
      // Green is max
      h = (b - r) / delta + 2;
    } else {
      // Blue is max
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60 * 100) / 100;
    if (h < 0) h += 360;
  }

  const l = (cMax + cMin) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  const hsl: HSLOrHSLA = [h, +(s * 100).toFixed(2), +(l * 100).toFixed(2)];
  if (a != null && a > -1) hsl.push(a);

  return hsl;
}

function toFixed(value: number, digits: number): string {
  return Number.isFinite(value) && Number.isFinite(digits) ? value.toFixed(digits) : `${value}`;
}

function calculate(color: string, h: number, s: number, l: number, a?: number) {
  const newHslValue = `hsl${a && a > -1 ? 'a' : ''}(${h}, ${s}%, ${l}%${a && a > -1 ? `, ${a * 100}%` : ''})`;
  if (color.startsWith('#')) {
    return toHexStr(newHslValue);
  }
  if (color.startsWith('rgb')) {
    return toRgbStr(newHslValue);
  }
  return newHslValue;
}
