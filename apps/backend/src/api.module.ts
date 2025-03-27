import { Module } from '@nestjs/common';
import { AuthenticatorModule } from './api/auth/authenticator.module';
import { LocationModule } from './api/location/location.module';
import { NotificationModule } from './api/subscribe/notification.module';
import { TranscribeModule } from './api/transcribe/transcribe.module';
import { WidgetModule } from './api/widget/widget.module';

@Module({
  // Setup backend modules
  imports: [AuthenticatorModule, WidgetModule, LocationModule, TranscribeModule, NotificationModule],
})
export class ApiModule {}
