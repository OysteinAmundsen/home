import { Controller, Get, Param } from '@nestjs/common';
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
   * Fetch all widget tags.
   */
  @Get('tags')
  getAllTags() {
    return this.widgetService.getAvailableTags();
  }

  /**
   * Fetch widgets by tag
   */
  @Get(':tag')
  filterByTag(@Param('tag') tag: string) {
    return this.widgetService.getWidgetsByTag(tag);
  }
}
