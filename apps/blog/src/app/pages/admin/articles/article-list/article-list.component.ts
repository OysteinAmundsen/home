import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ArticleStatus } from '@home/shared/blog/enums';
import { Article } from '@home/shared/blog/interfaces';
import { SnackbarService } from '@home/shared/ux/snackbar/snackbar.service';
import { ArticleService } from '../../../../services/article.service';

@Component({
  selector: 'app-article-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss',
})
export class ArticleListComponent implements OnInit {
  private readonly articleService = inject(ArticleService);
  private readonly snackBar = inject(SnackbarService); // Service signals accessed through getters to avoid initialization order issues
  readonly articles = () => this.articleService.articles();
  readonly loading = () => this.articleService.loading();
  readonly totalArticles = () => this.articleService.totalArticles();
  readonly totalPages = computed(() => Math.ceil(this.totalArticles() / this.pageSize));
  readonly currentPage = () => this.articleService.currentPage();

  searchTerm = '';
  selectedStatus = '';
  pageSize = 10;
  displayedColumns: string[] = ['thumbnail', 'title', 'status', 'publishedAt', 'updatedAt', 'actions'];

  constructor() {
    // Effect to handle errors
    effect(() => {
      const error = this.articleService.error();
      if (error) {
        this.snackBar.open('Error loading articles', 'Close', { duration: 5000 });
      }
    });
  }

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles(page = 1) {
    const params: { page: number; limit: number; search?: string; status?: ArticleStatus } = {
      page,
      limit: this.pageSize,
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedStatus) params.status = this.selectedStatus as ArticleStatus;

    // Use the new signal-based API
    this.articleService.loadAdminArticles(params);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.pageSize = event.pageSize;
    this.loadArticles(event.pageIndex + 1); // Material paginator is 0-based, our API is 1-based
  }

  onSearchChange() {
    // Debounce search and reset to first page
    setTimeout(() => this.loadArticles(1), 300);
  }

  onFilterChange() {
    this.loadArticles(1); // Reset to first page when filter changes
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
          this.snackBar.open('Article deleted successfully', 'Close', { duration: 3000 });
        })
        .catch((error) => {
          console.error('Error deleting article:', error);
          this.snackBar.open('Error deleting article', 'Close', { duration: 5000 });
        });
    }
  }
}
