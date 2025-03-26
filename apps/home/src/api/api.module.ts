import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticatorModule } from './auth/authenticator.module';
import { LocationModule } from './location/location.module';
import { NotificationModule } from './subscribe/notification.module';
import { TranscribeModule } from './transcribe/transcribe.module';
import { typeOrmConfig } from './typeorm.config';
import { WidgetModule } from './widget/widget.module';

@Module({
  // Setup backend modules
  imports: [
    AuthenticatorModule,
    WidgetModule,
    LocationModule,
    TranscribeModule,
    NotificationModule,
    TypeOrmModule.forRoot(typeOrmConfig),
  ],
})
export class ApiModule {}
