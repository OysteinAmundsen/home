import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { ApiModule } from './api.module';

export * from './api.module';

export async function createServer(ssrMode = false): Promise<NestExpressApplication> {
  // Create the NestJS application
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);

  // Setup session middleware
  app.use(
    session({
      secret: 'Not a real secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        maxAge: 60000,
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    // LOG INCOMING REQUESTS
    // (except proxy requests which has its own logger)
    res.on('finish', () => {
      switch (Math.round(res.statusCode / 100)) {
        case 4:
          Logger.warn(`${req.url}`, `${req.method} (${res.statusCode})`);
          break;
        case 5:
          Logger.error(`${req.url}`, `${req.method} (${res.statusCode})`);
          break;
        default:
          Logger.log(`${req.url}`, `${req.method} (${res.statusCode})`);
      }
    });
    next();
  });

  app.use(compression());

  return app;
}
