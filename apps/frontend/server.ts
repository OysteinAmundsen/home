/* eslint-disable @nx/enforce-module-boundaries */
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { createServer } from '@home/backend/';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import net from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { proxyRoutes } from './proxy.routes';

async function bootstrap() {
  let app: NestExpressApplication | undefined;
  let server: express.Express;

  // Check if the backend server is already running
  // If it is, we just start an express server for the Angular SSR
  // If not, we create the NestJS application and start it
  // Check if port 3000 is actively listening
  const backendExists = await new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => tester.close(() => resolve(false)))
      .listen(3000);
  });
  if (backendExists) {
    Logger.log('Backend already up and running. Starting just Angular SSR.');
    server = express();
  } else {
    // Create the NestJS application
    app = await createServer(true);
    server = app.getHttpAdapter().getInstance();
  }

  // Setup reverse proxy routes
  Object.entries(proxyRoutes).forEach(([path, config]) => {
    server.use(path, createProxyMiddleware(config));
  });
  if (backendExists) {
    // Setup reverse proxy for the backend api
    server.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: (path, req) => '/api' + path.replace(/^\/api/, ''),
      }),
    );
  }

  server.use((req: Request, res: Response, next: NextFunction) => {
    // ADD SECURITY HEADERS
    // The 'unsafe-inline' are for the inline scripts in the Angular app
    // They are included inline by the framework and are responsible for
    // "jsaction" event replay. We tried to use sha's here to avoid unsafe-inline,
    // but the sha's are different on every build, so we can't use them.
    const csp = `
      default-src 'self';
      script-src  'self' 'unsafe-inline';
      style-src   'self' 'unsafe-inline' fonts.googleapis.com;
      img-src     'self';
      font-src    'self' fonts.gstatic.com;
      connect-src 'self' fonts.gstatic.com;
    `.replace(/\n/g, '');
    res.setHeader('Content-Security-Policy', csp);

    const permissions = ['geolocation=(self)', 'microphone=(self)'];
    res.setHeader('Permissions-Policy', permissions.join(', '));
    next();
  });

  // Serve static files from the browser distribution folder
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  server.get(
    '*splat',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    }),
  );

  // SSR middleware: Render out the angular application server-side
  const angularNodeAppEngine = new AngularNodeAppEngine();
  server.use('*splat', (req, res, next) => {
    angularNodeAppEngine
      .handle(req, {
        server: 'express',
        request: req,
        response: res,
        cookies: req.headers.cookie,
      })
      .then((response) => {
        // If the Angular app returned a response, write it to the Express response
        if (response) {
          return writeResponseToNodeResponse(response, res);
        }
        // If not, this is not an Angular route, so continue to the next middleware
        return next();
      })
      .catch(next);
  });

  // Initialize the NestJS application and return the server
  if (app != null) app.init();
  return server;
}

const server = await bootstrap();
if (isMainModule(import.meta.url)) {
  const port = process.env.PORT || 4200;
  server.listen(port, () => {
    Logger.log(`SSR server listening on http://localhost:${port}`);
  });
}

// This exposes the RequestHandler
export const reqHandler = createNodeRequestHandler(server);
