import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { AuthenticatorModule } from './app/auth/authenticator.module';
import { LocationModule } from './app/location/location.module';
import { NotificationModule } from './app/subscribe/notification.module';
import { TranscribeModule } from './app/transcribe/transcribe.module';
import { WidgetModule } from './app/widget/widget.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Subscription } from './app/subscribe/subscription.entity';

try {
  // This is required for ESM support when running backend through SSR
  globalThis.__filename = fileURLToPath(import.meta.url); // Resolve current file path for ESM
  globalThis.__dirname = dirname(globalThis.__filename); // Resolve directory path for ESM
} catch (error) {
  // This happens when running pure backend
}

@Module({
  imports: [
    AuthenticatorModule,
    LocationModule,
    NotificationModule,
    TranscribeModule,
    WidgetModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'homeDB.sqlite',
      entities: [Subscription],
      synchronize: true,
      logging: true,
    }),
  ],
})
export class ApiModule {}
