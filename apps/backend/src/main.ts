import { Logger } from '@nestjs/common';
import express from 'express';
import { resolve } from 'node:path';
import { createServer } from './index';

async function bootstrap() {
  const app = await createServer();

  // Serve swagger static files
  app.use(
    '/api',
    express.static(resolve(__dirname, './api'), {
      maxAge: '1y',
      index: 'index.html',
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    Logger.log(`Backend server listening on http://localhost:${port}`);
  });
}

bootstrap();
