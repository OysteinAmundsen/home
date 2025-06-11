import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app/app.module';

export * from './app/app.module';

export async function createServer(): Promise<NestExpressApplication> {
  // Create the NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // API route prefix
  app.setGlobalPrefix('api');

  app.use((req: Request, res: Response, next: NextFunction) => {
    // LOG INCOMING REQUESTS
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

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('API for blog content generation')
    .setVersion('1.0')
    .build();
  const documentBuilder = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentBuilder, {
    jsonDocumentUrl: 'api/json',
  });

  return app;
}
