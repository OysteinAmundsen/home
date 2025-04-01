import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { ApiModule } from './api.module';

export * from './api.module';
export * from './proxy.routes';

export async function createServer(withDB = true): Promise<{
  app: NestExpressApplication;
  server: express.Express;
}> {
  // Create the NestJS application
  const app = await NestFactory.create<NestExpressApplication>(ApiModule.forRoot(withDB));

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

  const server = app.getHttpAdapter().getInstance();
  server.use((req: Request, res: Response, next: NextFunction) => {
    // LOG INCOMING REQUESTS
    // (except proxy requests which has its own logger)
    Logger.log(`${req.url}`, `${req.method}`);
    next();
  });

  return {
    app,
    server,
  };
}
