import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Article } from '@home/shared/blog/interfaces';
import { MarkdownPipe } from '@home/shared/pipes/markdown.pipe';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-detail',
  imports: [CommonModule, RouterModule, MarkdownPipe, LoadingSpinnerComponent],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
})
export class ArticleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly articleService = inject(ArticleService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  readonly article = signal<Article | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    // Effect to watch for article changes from the service
    effect(() => {
      const serviceArticle = this.articleService.currentArticle();
      const isLoading = this.articleService.currentArticleLoading();

      this.loading.set(isLoading);

      if (serviceArticle) {
        this.article.set(serviceArticle);
        this.error.set(null);
        this.updateMetaTags(serviceArticle);
      } else if (!isLoading) {
        // Only set error if not loading and we expected an article
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
          this.error.set('Article not found');
        }
      }
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Invalid article URL');
      this.loading.set(false);
      return;
    }

    this.loadArticle(slug);
  }

  private loadArticle(slug: string): void {
    // Use the new signal-based API
    this.articleService.getArticleBySlug(slug);
  }

  private updateMetaTags(article: Article): void {
    this.titleService.setTitle(`${article.title} | Personal Blog`);

    const excerpt = this.getExcerpt(article);
    this.metaService.updateTag({ name: 'description', content: excerpt });
    this.metaService.updateTag({
      property: 'og:title',
      content: article.title,
    });
    this.metaService.updateTag({
      property: 'og:description',
      content: excerpt,
    });

    if (article.featuredImage) {
      this.metaService.updateTag({
        property: 'og:image',
        content: article.featuredImage,
      });
    }
  }
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateForAttribute(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
  }
  getReadingTime(): number {
    const article = this.article();
    if (!article) return 0;

    const wordsPerMinute = 200;
    const textContent = article.content;
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private getExcerpt(article: Article): string {
    if (!article.content) return '';

    // Extract first paragraph from markdown
    const lines = article.content.split('\n');
    const firstParagraph = lines.find((line) => line.trim() && !line.startsWith('#'));
    if (!firstParagraph) return '';

    const maxLength = 160;
    if (firstParagraph.length <= maxLength) return firstParagraph;

    return firstParagraph.substring(0, maxLength).trim() + '...';
  }
}
