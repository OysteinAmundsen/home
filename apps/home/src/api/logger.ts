import { format } from 'date-fns';
import type * as httpProxy from 'http-proxy';
import { Options } from 'http-proxy-middleware';

enum Color {
  // Foreground
  FG_Black = 30,
  FG_Red = 31,
  FG_Green = 32,
  FG_Yellow = 33,
  FG_Blue = 34,
  FG_Magenta = 35,
  FG_Cyan = 36,
  FG_White = 37,
  // Background
  BG_Black = 40,
  BG_Red = 41,
  BG_Green = 42,
  BG_Yellow = 43,
  BG_Blue = 44,
  BG_Magenta = 45,
  BG_Cyan = 46,
  BG_White = 47,
}

export function logger(system: string, type: string, message: string) {
  console.log(
    [
      wrap(Color.FG_Green, `[${system}]`.padEnd(6, ' ')),
      wrap(Color.FG_Green, `${process.pid}  -`),
      `${format(new Date(), 'dd.MM.yyyy, HH:mm:ss')}`.padEnd(24, ' '),
      wrap(Color.FG_Green, 'LOG'),
      wrap(Color.FG_Yellow, `[${type}]`),
      `${message}`,
    ].join(' '),
  );
}

function wrap(color: Color, message: string) {
  return `\x1b[${color}m${message}\x1b[0m`;
}

// https://github.com/chimurai/http-proxy-middleware/blob/master/src/plugins/default/logger-plugin.ts
export const requestLogger = (proxyServer: httpProxy, options: Options) => {
  proxyServer.on('proxyRes', (proxyRes: any, req, res) => {
    let target: URL;
    try {
      target = new URL(`${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path}`);
      const port = Object.keys(proxyRes.req?.agent?.sockets || {})?.[0]?.split(':')[1];
      if (port) {
        target.port = port;
      }
    } catch (err) {
      target = new URL(options.target as URL);
      target.pathname = proxyRes.req.path;
    }
    logger('HPM', `${req.method}`, `${target.toString()} [${proxyRes.statusCode}]`);
  });
};
