import { NextFunction, Request, Response } from 'express';
import { Options } from 'http-proxy-middleware';

export const proxyRoutes: Record<string, Options> = {
  '/api/weather': {
    target: 'https://api.met.no',
    changeOrigin: true,
    pathRewrite: (path, req) => '/weatherapi/locationforecast/2.0/compact' + path.replace(/^\/api\/weather/, ''),
    logger: console,
  },
  '/api/background': {
    target: 'https://picsum.photos',
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: () => {
      const now = new Date();
      const seed = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return `/seed/${seed}/1920/1080?grayscale&blur=8`;
    },
    logger: console,
  },
  '/api/fund/instrument_search': {
    target: 'https://public.nordnet.no',
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: (path, req) => '/api/2/instrument_search' + path.replace(/^\/api\/fund\/instrument_search/, ''),
    headers: {
      'client-id': 'NEXT',
    },
    logger: console,
  },
  '/api/fund/market-data': {
    target: 'https://api.prod.nntech.io',
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: (path, req) => '/market-data' + path.replace(/^\/api\/fund\/market-data/, ''),
    headers: {
      'x-locale': 'ng-NO',
    },
    logger: console,
  },
};

// Middleware to log all incoming requests
export function logRequests(req: Request, res: Response, next: NextFunction) {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
}
