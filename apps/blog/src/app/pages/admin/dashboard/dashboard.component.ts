import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ArticleStatus } from '@home/shared/blog/enums';
import { Article } from '@home/shared/blog/interfaces';
import { ArticleService } from '../../../services/article.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly articleService = inject(ArticleService); // Computed signals derived from the article service
  readonly totalArticles = computed(() => this.articleService.adminArticles().length);
  readonly publishedArticles = computed(
    () => this.articleService.adminArticles().filter((a: Article) => a.status === ArticleStatus.PUBLISHED).length,
  );
  readonly draftArticles = computed(
    () => this.articleService.adminArticles().filter((a: Article) => a.status === ArticleStatus.DRAFT).length,
  );

  constructor() {
    // Effect to handle errors
    effect(() => {
      const error = this.articleService.adminError();
      if (error) {
        console.error('Error loading articles for stats:', error);
      }
    });
  }

  ngOnInit() {
    // Load all articles for stats calculation
    this.articleService.loadAdminArticles({ page: 1, limit: 1000 });
  }
}
