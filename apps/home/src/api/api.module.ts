import { Module } from '@nestjs/common';
import { WidgetController } from './widget/widget.controller';
import { WidgetService } from './widget/widget.service';

@Module({
  // Setup api routes
  controllers: [WidgetController],
  providers: [WidgetService],
})
export class ApiModule {}
