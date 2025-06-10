import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60000,
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    // LOG INCOMING REQUESTS
    // (except proxy requests which has its own logger)
    res.on('finish', () => {
      if (req.originalUrl.startsWith('/api')) {
        return;
      }
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

  const config = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setDescription('Documentation for the Dashboard API')
    .setVersion('1.0')
    .build();
  const documentBuilder = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentBuilder, {
    jsonDocumentUrl: 'api/json',
  });

  return app;
}
