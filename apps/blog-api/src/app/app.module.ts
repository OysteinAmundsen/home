import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UploadsModule } from '../../../blog-api/src/app/uploads/uploads.module';
import { ArticlesModule } from './articles/articles.module';
import { HealthController } from './health/health.controller';

try {
  // This is required for ESM support when running backend through SSR
  globalThis.__filename = fileURLToPath(import.meta.url); // Resolve current file path for ESM
  globalThis.__dirname = dirname(globalThis.__filename); // Resolve directory path for ESM
} catch {
  // This happens when running pure backend
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ArticlesModule,
    UploadsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
