import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArticleStatus } from '@home/shared/blog/enums';
import { Article } from '@home/shared/blog/interfaces';
import { SnackbarService } from '@home/shared/ux/snackbar/snackbar.service';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { firstValueFrom } from 'rxjs';
import { ArticleQuery, ArticleService } from '../../../../services/article.service';

@Component({
  selector: 'app-article-list',
  imports: [CommonModule, RouterLink, FormsModule, LoadingSpinnerComponent],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss',
})
export class ArticleListComponent {
  private readonly articleService = inject(ArticleService);
  private readonly snackBar = inject(SnackbarService); // Service signals accessed through getters to avoid initialization order issues

  currentPage = signal(1);
  searchTerm = signal<string>('');
  selectedStatus = signal<ArticleStatus | ''>('');
  pageSize = signal(10);
  displayedColumns: string[] = ['thumbnail', 'title', 'status', 'publishedAt', 'updatedAt', 'actions'];
  articles = resource({
    params: () =>
      ({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus(),
        search: this.searchTerm(),
        all: false,
      }) as ArticleQuery,
    loader: async ({ params }) => {
      const articles = await firstValueFrom(this.articleService.getArticles(params));
      return articles;
    },
  });

  readonly totalArticles = () => this.articles.value()?.data.length || 0;
  readonly totalPages = computed(() => Math.ceil(this.totalArticles() / this.pageSize()));

  constructor() {
    // Effect to handle errors
    effect(() => {
      const error = this.articles.error();
      if (error) {
        this.snackBar.open('Error loading articles', 'error', { duration: 5000 });
      }
    });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.pageSize.set(event.pageSize);
  }

  getStatusColor(status: ArticleStatus): 'primary' | 'accent' | 'warn' {
    return status === ArticleStatus.PUBLISHED ? 'primary' : 'accent';
  }

  deleteArticle(article: Article) {
    if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
      // Use the new async signal-based method
      this.articleService
        .deleteArticle(article.id)
        .then(() => {
          this.snackBar.open('Article deleted successfully', 'info', { duration: 5000 });
        })
        .catch((error) => {
          console.error('Error deleting article:', error);
          this.snackBar.open('Error deleting article', 'error', { duration: 5000 });
        });
    }
  }
}
