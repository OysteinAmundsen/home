import { Controller, forwardRef, Get, Inject, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WidgetResponse } from './widget.model';
import { WidgetService } from './widget.service';

/**
 * The controller for the /api/widgets route.
 *
 * @param server
 */
@ApiTags('widgets')
@Controller('api/widgets')
export class WidgetController {
  constructor(@Inject(forwardRef(() => WidgetService)) private widgetService: WidgetService) {}

  /**
   * Fetch all widgets.
   */
  @Get()
  @ApiOperation({ summary: 'Get all widgets' })
  @ApiOkResponse({ description: 'An array of widgets', type: WidgetResponse, isArray: true })
  getAll() {
    return this.widgetService.getWidgets();
  }

  /**
   * Fetch all widget tags.
   */
  @Get('tags')
  @ApiOperation({ summary: 'Get all widget tags' })
  @ApiOkResponse({ description: 'An array of widget tags.', type: 'string', isArray: true })
  getAllTags() {
    return this.widgetService.getAvailableTags();
  }

  /**
   * Fetch widgets by tag
   */
  @Get(':tag')
  @ApiOperation({ summary: 'Get widgets by tag' })
  @ApiOkResponse({ description: 'An array of widgets filtered by tag.', type: WidgetResponse, isArray: true })
  filterByTag(@Param('tag') tag: string) {
    return this.widgetService.getWidgetsByTag(tag);
  }
}
