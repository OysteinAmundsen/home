import { Module } from '@nestjs/common';
import { AuthenticatorModule } from './auth/authenticator.module';
import { WhisperModule } from './whisper/whisper.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  // Setup backend modules
  imports: [AuthenticatorModule, WidgetModule, WhisperModule],
})
export class ApiModule {}
