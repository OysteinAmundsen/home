import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
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
    Logger.log(`${req.url}`, `${req.method}`);
    next();
  });

  return app;
}
