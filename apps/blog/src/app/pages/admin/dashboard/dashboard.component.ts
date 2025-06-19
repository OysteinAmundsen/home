import { CommonModule } from '@angular/common';
import { Component, computed, inject, linkedSignal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleStatus } from '@home/shared/blog/enums';
import { Article } from '@home/shared/blog/interfaces';
import { firstValueFrom } from 'rxjs';
import { ArticleQuery, ArticleService } from '../../../services/article.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly articleService = inject(ArticleService); // Computed signals derived from the article service

  private readonly _query = linkedSignal<ArticleQuery>(
    () =>
      ({
        page: 1,
        limit: 10,
        status: ArticleStatus.PUBLISHED,
        search: '',
        all: false,
      }) as ArticleQuery,
  );
  articles = resource({
    params: () => this._query(),
    loader: async ({ params }) => {
      const articles = await firstValueFrom(this.articleService.getArticles(params));
      return articles;
    },
  });

  readonly totalArticles = computed(() => this.articles.value()?.data.length || 0);
  readonly publishedArticles = computed(
    () => this.articles.value()?.data.filter((a: Article) => a.status === ArticleStatus.PUBLISHED).length || 0,
  );
  readonly draftArticles = computed(
    () => this.articles.value()?.data.filter((a: Article) => a.status === ArticleStatus.DRAFT).length || 0,
  );
}
