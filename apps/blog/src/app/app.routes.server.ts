import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';
import { ArticleService } from './services/article.service';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'articles/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const articleService = inject(ArticleService);
      const articles = await firstValueFrom(
        articleService.getArticles({
          page: 1,
          limit: 100,
          status: 'published' as const,
        }),
      );
      return articles.data.map((article) => ({
        slug: article.slug,
      }));
    },
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
