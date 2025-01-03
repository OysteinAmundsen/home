import { Module } from '@nestjs/common';
import { WidgetController } from './widget/widget.controller';

@Module({
  // Setup api routes
  controllers: [WidgetController],
})
export class ApiModule {}
