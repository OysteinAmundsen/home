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
    followRedirects: true,
    pathRewrite: () => {
      const now = new Date();
      const seed = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return `/seed/${seed}/1920/1080?grayscale&blur=8`;
    },
    // on: {
    //   // This api returns a 302 redirect to the actual image
    //   // We do not want to allow our client to follow a redirect,
    //   // it is much cleaner if this is handled by the server
    //   proxyRes: async (proxyRes, req, res) => {
    //     if (res.statusCode === 302 && res.headers.location) {
    //       try {
    //         const redirectUrl = proxyRes.headers.location;
    //         const response = await fetch(redirectUrl);
    //         const content = await response.arrayBuffer();
    //         res.writeHead(200, 'OK', {'content-type'});
    //         res.end(content);
    //       } catch (error) {
    //         res.writeHead(500);
    //         res.end('Error fetching redirected content');
    //       }
    //     }
    //   },
    // },
    logger: console,
  },
};
