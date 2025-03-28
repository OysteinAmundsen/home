import { Module } from '@nestjs/common';
import { AuthenticatorModule } from './app/auth/authenticator.module';
import { LocationModule } from './app/location/location.module';
import { NotificationModule } from './app/subscribe/notification.module';
import { TranscribeModule } from './app/transcribe/transcribe.module';
import { WidgetModule } from './app/widget/widget.module';

@Module({
  // Setup backend modules
  imports: [AuthenticatorModule, WidgetModule, LocationModule, TranscribeModule, NotificationModule],
})
export class ApiModule {}
