import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './services/api.service';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'articles/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const apiService = inject(ApiService);
      const articles = await firstValueFrom(
        apiService.getArticles({
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
