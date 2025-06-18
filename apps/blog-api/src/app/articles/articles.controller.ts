import { ArticleQueryDto, ArticleResponseDto, CreateArticleDto, UpdateArticleDto } from '@home/shared/blog/dto';
import { Article, PaginatedResponse } from '@home/shared/blog/interfaces';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // Public endpoints for frontend consumption
  @Get()
  @ApiOperation({ summary: 'Get all published articles with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'all', required: false, description: 'Return all articles without pagination', example: 'true' })
  @ApiOkResponse({ description: 'Returns paginated published articles' })
  async findAll(@Query() query: ArticleQueryDto): Promise<PaginatedResponse<ArticleResponseDto>> {
    return this.articlesService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published article by slug' })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  @ApiOkResponse({ description: 'Returns the published article', type: ArticleResponseDto })
  @ApiNotFoundResponse({ description: 'Article not found' })
  async findBySlug(@Param('slug') slug: string): Promise<ArticleResponseDto> {
    return this.articlesService.findBySlug(slug);
  }

  // Admin endpoints
  @Post()
  @ApiOperation({ summary: 'Create article (Admin only)' })
  @ApiCreatedResponse({ description: 'Article created successfully' })
  @ApiBadRequestResponse({ description: 'Bad request - Article with slug already exists' })
  async create(@Body() createArticleDto: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(createArticleDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update article (Admin only)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  @ApiOkResponse({ description: 'Article updated successfully' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  async update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete article (Admin only)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  @ApiOkResponse({ description: 'Article deleted successfully' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.articlesService.remove(id);
  }
}
