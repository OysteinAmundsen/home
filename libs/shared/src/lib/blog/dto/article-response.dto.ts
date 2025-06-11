import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Article ID',
    example: 'welcome-to-my-blog',
  })
  id!: string;

  @ApiProperty({
    description: 'Article title',
    example: 'Welcome to My Blog',
  })
  title!: string;

  @ApiProperty({
    description: 'Article slug for URL',
    example: 'welcome-to-my-blog',
  })
  slug!: string;
  @ApiProperty({
    description: 'Article content in markdown format',
    example: '# Welcome\n\nThis is the article content in **markdown** format.',
  })
  content!: string;

  @ApiProperty({
    description: 'Article excerpt',
    example: 'A brief introduction to my blog...',
    required: false,
  })
  excerpt?: string;

  @ApiProperty({
    description: 'Featured image URL',
    example: '/uploads/featured-image.jpg',
    required: false,
  })
  featuredImage?: string;

  @ApiProperty({
    description: 'Article status',
    example: 'published',
  })
  status!: string;

  @ApiProperty({
    description: 'Publication date',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  publishedAt?: Date;

  @ApiProperty({
    description: 'Last updated date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Article author',
    example: 'Admin',
    required: false,
  })
  author?: string;

  @ApiProperty({
    description: 'Article tags',
    type: 'array',
    items: { type: 'string' },
    example: ['technology', 'web development'],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: 'SEO meta description',
    example: 'Learn about web development in this comprehensive guide...',
    required: false,
  })
  metaDescription?: string;

  @ApiProperty({
    description: 'Estimated reading time in minutes',
    example: 5,
    required: false,
  })
  readingTimeMinutes?: number;
}
