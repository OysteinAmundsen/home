// ------------------------------------------------------
// COLOR UTILITIES
// ------------------------------------------------------
/** Return the hue of any color value */
export function getHue(color: string): number {
  const [h, s, l, a] = toHsl(color);
  return h;
}
/**
 * Convert to HSLA and add the given percentage to the Hue.
 * Color will be returned in the format given (hex, rgb, hsl)
 */
export function addHue(color: string, degrees: number): string {
  const [h, s, l, a] = toHsl(color);
  return calculate(
    color,
    h + degrees > 360 ? h + degrees - 360 : h + degrees,
    s,
    l,
    a,
  );
}

/** Return the saturation of any color value */
export function getSaturation(color: string): number {
  const [h, s, l, a] = toHsl(color);
  return s;
}
/**
 * Convert to HSLA and rewrite the Saturation with the given percentage.
 * Color will be returned in the format given (hex, rgb, hsl)
 */
export function setSaturation(color: string, percent: number): string {
  const [h, s, l, a] = toHsl(color);
  return calculate(color, h, percent, l, a);
}

/** Return the lightness of any color value */
export function getLightness(color: string): number {
  const [h, s, l, a] = toHsl(color);
  return l;
}

/** Return the alpha value of any color value */
export function getAlpha(color: string): number {
  const [h, s, l, a] = toHsl(color);
  return a != null ? a : 255;
}

export function setAlpha(color: string, alpha: number): string {
  const [h, s, l] = toHsl(color);
  return calculate(color, h, s, l, alpha);
}

/**
 * Convert to HSLA and add the given percentage to the Lightness
 * Color will be returned in the format given (hex, rgb, hsl)
 */
export function lighten(color: string, percent: number): string {
  const [h, s, l, a] = toHsl(color);
  return calculate(color, h, s, l + percent > 100 ? 100 : l + percent, a);
}
/**
 * Convert to HSLA and subtract the given percentage to the Lightness
 * Color will be returned in the format given (hex, rgb, hsl)
 */
export function darken(color: string, percent: number): string {
  const [h, s, l, a] = toHsl(color);
  return calculate(color, h, s, l - percent < 0 ? 0 : l - percent, a);
}

function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// --------------------------------------------------------------------
// Conversion functions
//
// Converts between different color formats
// --------------------------------------------------------------------
// #region hex
/**
 * Convert any color string to hex.
 * Accepts alpha values.
 *
 * USAGE:
 * `toHex('rgb(255, 255, 255)')` => '#FFFFFF';
 * `toHex('hsl(255, 255, 255)')` => '#FFFFFF';
 * `toHex('#FFFFFF')` => '#FFFFFF';
 */
export const toHex = (color: string) => {
  if (color.startsWith('rgb')) return rgbStrToHex(color);
  if (color.startsWith('hsl')) return rgbStrToHex(hslStrToRgb(color));
  return color; // Assumes we already have hex
};

/**
 * Convert a `rgb(rrr, ggg, bbb)` string value to a hexadecimal color code.
 * Will also accept alpha.
 */
function rgbStrToHex(rgbString: string): string {
  const [r, g, b, a] = rgbString
    .substring(rgbString.indexOf('(') + 1, rgbString.indexOf(')'))
    .split(',')
    .map((n) => +n);
  return rgbToHex(r, g, b, a);
}

/**
 * Convert red, green and blue values to a hexadecimal color code.
 * Will also accept alpha
 */
export const rgbToHex = (
  r: number,
  g: number,
  b: number,
  a?: number,
): string => {
  const color =
    [r, g, b]
      .filter((x) => x != null)
      .map((x) => x?.toString(16).padStart(2, '0'))
      .join('') + (a != null ? alphaToHex(a) : '');
  return `#${color}`;
};

export function alphaToHex(a: number) {
  return Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
}

// #region rgb
/**
 * Convert any color string to rgb.
 * Accepts alpha values.
 *
 * USAGE:
 * `toRgb('rgb(255, 255, 255)')` => 'rgb(255, 255, 255)';
 * `toRgb('hsl(255, 255, 255)')` => 'rgb(255, 255, 255)';
 * `toRgb('#FFFFFF')` => 'rgb(255, 255, 255)';
 */
export function toRgb(color: string) {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  if (color.startsWith('hsl')) {
    return hslStrToRgb(color);
  }
  return color; // Assumes we already have rgb
}

/**
 * Convert a hexadecimal color code to `rgb(rrr, ggg, bbb)` value
 * Will also accept alpha
 */
function hexToRgb(hex: string) {
  const res = hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => '#' + r + r + g + g + b + b,
    )
    .substring(1)
    .match(/.{2}/g)
    ?.map((x) => parseInt(x, 16));
  return (res && res.length > 3 ? 'rgba(' : 'rgb(') + res?.join(', ') + ')';
}

function hslStrToRgb(color: string): string {
  const [h, s, l, a] = color
    .substring(color.indexOf('(') + 1, color.indexOf(')'))
    .split(',')
    .map((n) => +(n.indexOf('%') > -1 ? n.substring(0, n.indexOf('%')) : n));
  return hslToRgb(h, s, l, a);
}

function hslToRgb(h: number, s: number, l: number, a?: number): string {
  if (s === 0) {
    s = 1;
  }

  // Must be fractions of 1
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `rgb${a && a > -1 ? 'a' : ''}(${r}, ${g}, ${b} ${a && a > -1 ? ', ' + a : ''})`;
}

// #region hsl
/**
 * Convert any color string to hsl.
 * Accepts alpha values.
 *
 * USAGE:
 * `toHex('rgb(255, 255, 255)')` => 'hsl(255, 255, 255)')';
 * `toHex('hsl(255, 255, 255)')` => 'hsl(255, 255, 255)')';
 * `toHex('#FFFFFF')` => 'hsl(255, 255, 255)')';
 */
export function toHslString(color: string) {
  let col = color;
  if (!col) return 'hsl(0, 0%, 0%)';
  if (col.startsWith('#')) {
    col = hexToRgb(color);
  }
  if (col.startsWith('rgb')) {
    return rgbStrToHsl(col);
  }
  return col; // Assumes we already have hsl
}

/**
 *
 * @param color
 * @returns
 */
export function toHsl(color: string): number[] {
  const hsl = toHslString(color);
  return hsl
    .substring(hsl.indexOf('(') + 1, hsl.indexOf(')'))
    .split(',')
    .map((n) => {
      return +n.replace('%', '').replace('deg', '').trim();
    });
}

function rgbStrToHsl(rgbString: string) {
  const [r, g, b, a] = rgbString
    .substring(rgbString.indexOf('(') + 1, rgbString.indexOf(')'))
    .split(',')
    .map((n) => +n);
  return rgbToHsl(r, g, b, a);
}

function rgbToHsl(r: number, g: number, b: number, a?: number): string {
  // Make r, g, and b fractions of 1
  r /= 255;
  g /= 255;
  b /= 255;

  // Find greatest and smallest channel values
  const cMin = Math.min(r, g, b);
  const cMax = Math.max(r, g, b);
  const delta = cMax - cMin;
  let h = 0;
  let s = 0;
  let l = 0;

  // Calculate hue
  if (delta === 0) {
    h = 0;
  } // No difference
  else if (cMax === r) {
    h = ((g - b) / delta) % 6;
  } // Red is max
  else if (cMax === g) {
    h = (b - r) / delta + 2;
  } // Green is max
  else {
    h = (r - g) / delta + 4;
  } // Blue is max

  h = Math.round(h * 60);

  if (h < 0) {
    h += 360;
  } // Make negative hues positive behind 360°
  l = (cMax + cMin) / 2; // Calculate lightness
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1)); // Calculate saturation

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `hsl${a != null && a > -1 ? 'a' : ''}(${toFixed(h, 1)},${toFixed(s, 3)}%, ${toFixed(l, 3)}%${
    a != null && a > -1 ? ', ' + a + '%' : 1
  })`;
}

function toFixed(value: number, digits: number) {
  return Number.isFinite(value) && Number.isFinite(digits)
    ? value.toFixed(digits)
    : value;
}

function calculate(color: string, h: number, s: number, l: number, a?: number) {
  const newHslValue = `hsl${a && a > -1 ? 'a' : ''}(${h}, ${s}%, ${l}%${a && a > -1 ? `, ${a * 100}%` : ''})`;
  if (color.startsWith('#')) {
    return toHex(newHslValue);
  }
  if (color.startsWith('rgb')) {
    return toRgb(newHslValue);
  }
  return newHslValue;
}
