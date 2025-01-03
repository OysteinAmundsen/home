import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
@Controller('api/widgets')
export class WidgetController {
  widgetData = [
    { id: 1, name: 'Weather', componentName: 'weather' },
    { id: 2, name: 'Taxes', componentName: 'widget2' },
    { id: 3, name: 'Something else', componentName: 'widget3' },
  ];

  /**
   * Fetch all widgets.
   */
  @Get()
  findAll() {
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
    return [this.widgetData.find((w) => w.id === id)];
  }
}
