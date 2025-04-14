import { Options } from 'http-proxy-middleware';
import { requestLogger } from './logger';

export const proxyRoutes: Record<string, Options> = {
  '/api/weather': {
    target: 'https://api.met.no',
    changeOrigin: true,
    pathRewrite: (path, req) => '/weatherapi/locationforecast/2.0/compact' + path.replace(/^\/api\/weather/, ''),
    plugins: [requestLogger],
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
    plugins: [requestLogger],
  },
  '/api/fund/market-data': {
    target: 'https://api.prod.nntech.io',
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: (path, req) => '/market-data' + path.replace(/^\/api\/fund\/market-data/, ''),
    headers: {
      'x-locale': 'ng-NO',
    },
    plugins: [requestLogger],
  },
  '/api/fund': {
    target: 'https://public.nordnet.no',
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: (path, req) => '/api/2' + path.replace(/^\/api\/fund/, ''),
    headers: {
      'client-id': 'NEXT',
    },
    plugins: [requestLogger],
  },
};
