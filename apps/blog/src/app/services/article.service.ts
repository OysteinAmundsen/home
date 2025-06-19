import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Article, PaginatedResponse } from '@home/shared/blog/interfaces';
import { cache } from '@home/shared/rxjs/cache';
import { firstValueFrom, Observable, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateArticleDto } from './article.types';

export interface ArticleQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  all?: boolean; // New parameter to get all articles without pagination
}

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/articles`;

  /**
   * Fetch articles based on the provided query parameters.
   * @param query The query parameters for fetching articles.
   * @returns An observable of the paginated response containing articles.
   */
  getArticles(query: ArticleQuery = {}): Observable<PaginatedResponse<Article>> {
    const key = `articles-${JSON.stringify(query)}`; // Unique cache key based on query parameters
    return cache(() => this.http.get<PaginatedResponse<Article>>(`${this.apiUrl}`, { params: { ...query } }), key).pipe(
      timeout(10000), // 10 second timeout
      retry({
        count: 1, // Reduced retry count to prevent excessive requests
        delay: 2000, // Increased delay
        resetOnSuccess: true,
      }),
    );
  }

  /**
   * Fetch a single article by its slug.
   * @param slug The slug of the article to fetch.
   * @returns An observable of the article.
   */
  getArticleBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${slug}`).pipe(timeout(10000), retry({ count: 2, delay: 1000 }));
  }

  /**
   * Fetch an article by its ID.
   * @param id The ID of the article to fetch.
   * @returns An observable of the article.
   */
  async getArticleById(id: string): Promise<Article> {
    return await firstValueFrom(this.http.get<Article>(`${this.apiUrl}/${id}`));
  }

  /**
   * Create a new article.
   * @param article The article to create.
   * @returns The created article.
   */
  async createArticle(article: CreateArticleDto): Promise<Article> {
    return await firstValueFrom(this.http.post<Article>(this.apiUrl, article));
  }

  /**
   * Update an existing article.
   * @param id The ID of the article to update.
   * @param article The updated article data.
   * @returns The updated article.
   */
  async updateArticle(id: string, article: Partial<CreateArticleDto>): Promise<Article> {
    return await firstValueFrom(this.http.patch<Article>(`${this.apiUrl}/${id}`, article));
  }

  /**
   * Delete an article by its ID.
   * @param id The ID of the article to delete.
   * @returns A promise that resolves when the article is deleted.
   */
  async deleteArticle(id: string): Promise<void> {
    return await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }

  /**
   * Upload an image.
   * @param file The image file to upload.
   * @returns An object containing the uploaded file's information.
   */
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
