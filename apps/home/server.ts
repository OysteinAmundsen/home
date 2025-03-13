import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import session from 'express-session';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiModule } from './src/api/api.module';
import { logRequests, proxyRoutes } from './src/api/proxy.routes';

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

  // Use the logRequests middleware
  server.use(logRequests);

  // Setup reverse proxy routes
  Object.entries(proxyRoutes).forEach(([path, config]) => {
    server.use(path, createProxyMiddleware(config));
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
