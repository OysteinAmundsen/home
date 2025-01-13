import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { widgetStore } from './widget.store';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
@Controller('api/widgets')
export class WidgetController {
  private widgetData = widgetStore;

  /**
   * Fetch all widgets.
   */
  @Get()
  getAll() {
    return this.widgetData;
  }

  /**
   * Fetch a single widget by ID.
   */
  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const widget = this.widgetData.find((w) => w.id === id);
    if (!widget) {
      throw new HttpException('Widget not found', HttpStatus.NOT_FOUND);
    }
    return [widget];
  }
}
