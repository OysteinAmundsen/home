import { Options } from 'http-proxy-middleware';

export const proxyRoutes: Record<string, Options> = {
  '/api/weather': {
    target: 'https://api.met.no',
    changeOrigin: true,
    pathRewrite: {
      '^/api/weather': '/weatherapi/locationforecast/2.0/compact',
    },
    logger: console,
  },
  '/api/background': {
    target: 'https://picsum.photos',
    changeOrigin: true,
    pathRewrite: (path: string, req: any) => {
      const now = new Date();
      const seed = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      return `/seed/${seed}/1920/1080?grayscale&blur=8`;
    },
    logger: console,
  },
};
