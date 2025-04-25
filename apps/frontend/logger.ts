import { Logger } from '@nestjs/common';
import type * as httpProxy from 'http-proxy';
import { Options } from 'http-proxy-middleware';

enum Color {
  Reset = 0,
  // Foreground
  FG_Black = 30,
  FG_Red = 31,
  FG_Green = 32,
  FG_Yellow = 33,
  FG_Blue = 34,
  FG_Magenta = 35,
  FG_Cyan = 36,
  FG_White = 37,
  FG_Crimson = 38,
  FG_Gray = 90,
  // Background
  BG_Black = 40,
  BG_Red = 41,
  BG_Green = 42,
  BG_Yellow = 43,
  BG_Blue = 44,
  BG_Magenta = 45,
  BG_Cyan = 46,
  BG_White = 47,
  BG_Crimson = 48,
  BG_Gray = 100,
}

/**
 * Create an escape sequence to set the color
 *
 * @param color The colors to set
 * @returns a string that sets the color
 */
function setColor(color: Color | Color[]): string {
  if (Array.isArray(color)) {
    return color.map((c) => `\x1b[${c}m`).join('');
  }
  return `\x1b[${color}m`;
}

/**
 * Create a string with the message wrapped in the color
 *
 * @param color The colors to wrap the message in
 * @param message The message to wrap
 * @returns A string with the message wrapped in the color
 */
function wrap(color: Color | Color[], message: string): string {
  return `${setColor(color)}${message}${setColor(Color.Reset)}`;
}

// https://github.com/chimurai/http-proxy-middleware/blob/master/src/plugins/default/logger-plugin.ts
export const requestLogger = (proxyServer: httpProxy, options: Options) => {
  proxyServer.on('proxyRes', (proxyRes: any, req, res) => {
    let target: URL;
    const proxyPath = `${(req as any).baseUrl || ''}`;
    try {
      target = new URL(`${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path}`);
      const port = Object.keys(proxyRes.req?.agent?.sockets || {})?.[0]?.split(':')[1];
      if (port) {
        target.port = port;
      }
    } catch {
      target = new URL(options.target as URL);
      target.pathname = proxyRes.req.path;
    }
    const fadIn = wrap([Color.FG_Black, Color.BG_Blue], '▓▒');
    const fadOut = wrap([Color.FG_Black, Color.BG_Blue], '▒▓');
    const arrow = `${fadIn}${wrap([Color.FG_White, Color.BG_Blue], '→')}${fadOut}`;
    Logger.log(`${proxyPath} ${arrow} ${target.toString()}`, `${req.method} (${res.statusCode})`);
  });
};
