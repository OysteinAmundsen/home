import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Article, PaginatedResponse } from '@home/shared/blog/interfaces';
import { Observable, catchError, retry, throwError, timeout } from 'rxjs';

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
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getArticles(query: ArticleQuery = {}): Observable<PaginatedResponse<Article>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    if (query.all) params = params.set('all', 'true');

    return this.http.get<PaginatedResponse<Article>>(`${this.baseUrl}/articles`, { params }).pipe(
      timeout(10000), // 10 second timeout
      retry({
        count: 1, // Reduced retry count to prevent excessive requests
        delay: 2000, // Increased delay
        resetOnSuccess: true,
      }),
      catchError((error) => {
        console.error('API Error:', error);
        // Return a more specific error that won't cause page navigation
        const errorMessage = error.status === 0 ? 'Unable to connect to server' : `Server error: ${error.status}`;
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  getArticleBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/articles/${slug}`).pipe(
      timeout(10000),
      retry({ count: 2, delay: 1000 }),
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }
  getArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.baseUrl}/articles/${id}`).pipe(
      timeout(10000),
      retry({ count: 2, delay: 1000 }),
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }
}
