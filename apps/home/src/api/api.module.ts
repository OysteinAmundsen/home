import { Module } from '@nestjs/common';
import { AuthenticatorModule } from './auth/authenticator.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  // Setup backend modules
  imports: [WidgetModule, AuthenticatorModule],
})
export class ApiModule {}
