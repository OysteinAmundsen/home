import { CommonModule } from '@angular/common';
import { Component, inject, linkedSignal, resource } from '@angular/core';
import { ArticleStatus } from '@home/shared/blog/enums';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { firstValueFrom } from 'rxjs';
import { ArticleQuery, ArticleService } from '../../services/article.service';
import { ArticleCardComponent } from './article-card/article-card.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ArticleCardComponent, LoadingSpinnerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly articleService = inject(ArticleService);

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

  retry() {
    this.articles.reload();
  }
}
