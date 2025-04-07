import { Logger } from '@nestjs/common';
import { createServer } from './index';

async function bootstrap() {
  const app = await createServer();
  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    Logger.log(`Backend server listening on http://localhost:${port}`);
  });
}

bootstrap();
