import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, linkedSignal, resource, signal } from '@angular/core';
import { ArticleStatus } from '@home/shared/blog/enums';
import { Article, PaginatedResponse } from '@home/shared/blog/interfaces';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { ArticleQueryParams, CreateArticleDto } from './article.types';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/articles`;

  // Unified query signal for both published and admin articles
  private readonly _query = linkedSignal<ArticleQueryParams>(
    () =>
      ({
        page: 1,
        limit: 10,
        status: ArticleStatus.PUBLISHED,
        search: undefined,
        all: false,
      }) as ArticleQueryParams,
  );

  // Single resource for all articles (published/admin)
  private readonly articlesResource = resource({
    params: this._query,
    loader: async ({ params }) => {
      const empty = {
        data: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      } as PaginatedResponse<Article>;

      try {
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.status) httpParams = httpParams.set('status', params.status);
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.all) httpParams = httpParams.set('all', 'true');

        // Always use the same endpoint for all queries
        const url = this.apiUrl;

        const response = await firstValueFrom(this.http.get<PaginatedResponse<Article>>(url, { params: httpParams }));
        return response || empty;
      } catch (error) {
        console.error('Error loading articles:', error);
        return empty;
      }
    },
  });

  // Signals for all articles (current query)
  readonly articles = computed(() => this.articlesResource.value()?.data || []);
  readonly loading = this.articlesResource.isLoading;
  readonly error = computed(() => (this.articlesResource.error() ? 'Failed to load articles' : null));
  readonly totalArticles = computed(() => this.articlesResource.value()?.total || 0);
  readonly currentPage = computed(() => this.articlesResource.value()?.page || 1);
  readonly totalPages = computed(() => this.articlesResource.value()?.totalPages || 1);

  // Methods to update query parameters for different views
  loadArticles(params?: ArticleQueryParams): void {
    // Published view: status 'published', all false
    this._query.set({ ...this._query(), ...(params || {}) });
  }

  searchArticles(searchTerm: string): void {
    this._query.set({ ...this._query(), search: searchTerm, status: ArticleStatus.PUBLISHED, all: false });
  }

  // Admin: show all articles (all statuses)
  loadAdminArticles(params: ArticleQueryParams = {}): void {
    this._query.set({ ...this._query(), ...params, all: true, status: params.status });
  }

  refreshArticles(): void {
    this._query.set({ ...this._query() });
  }

  // Resource for single article by slug
  private readonly _articleSlug = signal<string>('');
  private readonly singleArticleResource = resource({
    params: this._articleSlug,
    loader: async ({ params }) => {
      if (!params) return null;
      try {
        return await firstValueFrom(this.apiService.getArticleBySlug(params));
      } catch (error) {
        console.error('Error loading article:', error);
        return null;
      }
    },
  });

  readonly currentArticle = this.singleArticleResource.value;
  readonly currentArticleLoading = this.singleArticleResource.isLoading;

  getArticleBySlug(slug: string): void {
    this._articleSlug.set(slug);
  }

  getAdminArticles(params: ArticleQueryParams = {}): Observable<PaginatedResponse<Article>> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.all) httpParams = httpParams.set('all', 'true');

    // Always use the same endpoint for admin queries
    return this.http.get<PaginatedResponse<Article>>(this.apiUrl, { params: httpParams });
  }

  async getArticleById(id: string): Promise<Article> {
    return await firstValueFrom(this.http.get<Article>(`${this.apiUrl}/${id}`));
  }

  async createArticle(article: CreateArticleDto): Promise<Article> {
    const createdArticle = await firstValueFrom(this.http.post<Article>(this.apiUrl, article));
    this.refreshArticles();
    return createdArticle;
  }

  async updateArticle(id: string, article: Partial<CreateArticleDto>): Promise<Article> {
    const updatedArticle = await firstValueFrom(this.http.patch<Article>(`${this.apiUrl}/${id}`, article));
    this.refreshArticles();
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
    this.refreshArticles();
  }

  async uploadFile(file: File): Promise<{ filename: string; originalName: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return await firstValueFrom(
      this.http.post<{ filename: string; originalName: string; url: string }>(
        `${environment.apiUrl}/uploads`,
        formData,
      ),
    );
  }
}
