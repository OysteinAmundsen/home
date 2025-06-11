import { ArticleStatus } from '../enums/article-status.enum';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string; // Now a markdown string instead of ContentBlock[]
  excerpt?: string;
  featuredImage?: string;
  status: ArticleStatus;
  publishedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
  author?: string;
  tags?: string[];
  metaDescription?: string;
  readingTimeMinutes?: number;
}
