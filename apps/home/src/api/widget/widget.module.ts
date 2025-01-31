import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';

@Module({
  controllers: [WidgetController],
  providers: [WidgetService],
})
export class WidgetModule {}
