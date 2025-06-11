import { ArticleStatus } from '@home/shared/blog/enums';

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
  search?: string;
  all?: boolean;
}

export interface CreateArticleDto {
  title: string;
  content: string;
  status: ArticleStatus;
  featuredImage?: string;
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  id: string;
}
