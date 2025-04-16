import { Controller, forwardRef, Get, Inject, Param } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { ApiOkResponse } from '@nestjs/swagger';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
@Controller('api/widgets')
export class WidgetController {
  constructor(@Inject(forwardRef(() => WidgetService)) private widgetService: WidgetService) {}

  /**
   * Fetch all widgets.
   */
  @Get()
  @ApiOkResponse({ description: 'All widgets.' })
  getAll() {
    return this.widgetService.getWidgets();
  }

  /**
   * Fetch all widget tags.
   */
  @Get('tags')
  @ApiOkResponse({ description: 'All widget tags.' })
  getAllTags() {
    return this.widgetService.getAvailableTags();
  }

  /**
   * Fetch widgets by tag
   */
  @Get(':tag')
  @ApiOkResponse({ description: 'Widgets filtered by tag.' })
  filterByTag(@Param('tag') tag: string) {
    return this.widgetService.getWidgetsByTag(tag);
  }
}
