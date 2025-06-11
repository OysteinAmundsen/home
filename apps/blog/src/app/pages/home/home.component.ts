import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { Subject } from 'rxjs';
import { ArticleCardComponent } from './article-card/article-card.component';
import { ArticleService } from '../../services/article.service';

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
    if (isPlatformBrowser(this.platformId)) {
      // Load all articles at once
      this.articleService.loadArticles();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retry(): void {
    this.articleService.reset();
    if (isPlatformBrowser(this.platformId)) {
      this.articleService.loadArticles();
    }
  }
}
