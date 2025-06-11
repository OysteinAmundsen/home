import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ArticleStatus } from '../enums/article-status.enum';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'My First Blog Post',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Article content in markdown format',
    example: '# Introduction\n\nThis is my first blog post with **markdown** content.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Article status',
    enum: ArticleStatus,
    example: ArticleStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({
    description: 'Featured image URL',
    example: '/article-images/featured-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  featuredImage?: string;
}
