import { Module } from '@nestjs/common';
import { AuthenticatorModule } from './auth/authenticator.module';
import { LocationModule } from './location/location.module';
import { TranscribeModule } from './transcribe/transcribe.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  // Setup backend modules
  imports: [AuthenticatorModule, WidgetModule, LocationModule, TranscribeModule],
})
export class ApiModule {}
