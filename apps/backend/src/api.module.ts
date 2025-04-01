import { DynamicModule, Logger, Module } from '@nestjs/common';
import 'reflect-metadata';
import { AuthenticatorModule } from './app/auth/authenticator.module';
import { LocationModule } from './app/location/location.module';
import { NotificationModule } from './app/subscribe/notification.module';
import { TranscribeModule } from './app/transcribe/transcribe.module';
import { WidgetModule } from './app/widget/widget.module';

/**
 * When running standalone, we can take full advantage of the NestJS framework
 * When running in SSR mode, we cannot use a database connection as this utilizes
 * native modules not available in ESM and through Vite.
 */
@Module({})
export class ApiModule {
  static forRoot(withDB = true): DynamicModule {
    // Setup backend modules
    const moduleImports = [AuthenticatorModule, LocationModule, NotificationModule, TranscribeModule, WidgetModule];

    let TypeOrmModule: any;
    if (!withDB) {
      Logger.log('DB Not available when running in SSR mode', 'SSR');
    } else {
      // We need to import TypeOrmModule dynamically as it is not available in ESM mode
      TypeOrmModule = require('@nestjs/typeorm').TypeOrmModule;
    }

    return {
      module: ApiModule,
      imports: [
        ...moduleImports,
        ...(withDB
          ? [
              TypeOrmModule.forRoot({
                type: 'sqlite',
                database: 'homeDB.sqlite',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
              }),
            ]
          : []),
      ],
    };
  }
}
