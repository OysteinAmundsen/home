import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'reflect-metadata';
import { AuthenticatorModule } from './app/auth/authenticator.module';
import { User } from './app/auth/user.entity';
import { LocationModule } from './app/location/location.module';
import { NotificationModule } from './app/subscribe/notification.module';
import { Subscription } from './app/subscribe/subscription.entity';
import { TranscribeModule } from './app/transcribe/transcribe.module';
import { WidgetModule } from './app/widget/widget.module';

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
      database: resolve(process.cwd(), 'home.db'),
      entities: [User, Subscription],
      synchronize: true,
      logging: true,
    }),
  ],
})
export class ApiModule {}
