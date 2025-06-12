import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ArticleStatus } from '@home/shared/blog/enums';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { Subject } from 'rxjs';
import { ArticleService } from '../../services/article.service';
import { ArticleCardComponent } from './article-card/article-card.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ArticleCardComponent, LoadingSpinnerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly articleService = inject(ArticleService);
  private readonly platformId = inject(PLATFORM_ID);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Only load articles on browser side to prevent SSR issues
    this.retry();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retry(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.articleService.loadArticles({ status: ArticleStatus.PUBLISHED });
    }
  }
}
