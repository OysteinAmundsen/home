import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { WidgetService } from './widget.service';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
@Controller('api/widgets')
export class WidgetController {
  constructor(private widgetService: WidgetService) {}

  /**
   * Fetch all widgets.
   */
  @Get()
  getAll() {
    return this.widgetService.getWidgets();
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
    const widget = this.widgetService.getWidgets(id);
    if (!widget) {
      throw new HttpException('Widget not found', HttpStatus.NOT_FOUND);
    }
    return [widget];
  }
}
