import { Logger } from '@nestjs/common';
import { createServer } from './index';

async function bootstrap() {
  const app = await createServer();

  const port = process.env.PORT || 3001;
  await app.listen(port, () => {
    Logger.log(`Blog API server listening on http://localhost:${port}`);
    Logger.log(`🔧 API: http://localhost:${port}/api`);
    Logger.log(`📖 API Docs: http://localhost:${port}/api/docs`);
  });
}

bootstrap();
