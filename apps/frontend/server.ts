import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { ApiModule } from '@home/backend/api.module';
import { logger } from '@home/backend/logger';
import { proxyRoutes } from '@home/backend/proxy.routes';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);
  // Get the Express instance
  const server = app.getHttpAdapter().getInstance();

  // Setup session middleware
  app.use(
    session({
      secret: 'Not a real secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 60000,
      },
    }),
  );

  // Setup reverse proxy routes
  Object.entries(proxyRoutes).forEach(([path, config]) => {
    server.use(path, createProxyMiddleware(config));
  });

  server.use((req: Request, res: Response, next: NextFunction) => {
    // LOG INCOMING REQUESTS
    // (except proxy requests which has its own logger)
    logger('Expr', `${req.method}`, `${req.url}`);

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
  app.init();
  return server;
}

const server = await bootstrap();
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4200;
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// This exposes the RequestHandler
export const reqHandler = createNodeRequestHandler(server);
