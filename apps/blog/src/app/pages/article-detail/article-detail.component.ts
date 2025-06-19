import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, linkedSignal, resource, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Article } from '@home/shared/blog/interfaces';
import { MarkdownPipe } from '@home/shared/pipes/markdown.pipe';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-detail',
  imports: [CommonModule, RouterLink, MarkdownPipe, LoadingSpinnerComponent],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
})
export class ArticleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly articleService = inject(ArticleService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly destroyRef$ = inject(DestroyRef);

  slug = signal<string | null>(null);
  readonly article = resource({
    params: this.slug,
    loader: async ({ params }) => {
      if (!params) {
        this.error.set('Invalid article slug');
        return null;
      }

      try {
        // Load the article by slug
        const article = await firstValueFrom(this.articleService.getArticleBySlug(params));

        // Update the title and meta tags
        this.titleService.setTitle(`${article.title} | Personal Blog`);

        const excerpt = this.getExcerpt(article);
        this.metaService.updateTag({ name: 'description', content: excerpt });
        this.metaService.updateTag({ property: 'og:title', content: article.title });
        this.metaService.updateTag({ property: 'og:description', content: excerpt });

        if (article.featuredImage) {
          this.metaService.updateTag({ property: 'og:image', content: article.featuredImage });
        }
        return article;
      } catch (error) {
        this.error.set('Article not found');
        return null;
      }
    },
  });
  error = linkedSignal<string | null>(() => this.article.error()?.message || null);

  ngOnInit(): void {
    // Set the active slug from the route
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((params) => this.slug.set(params['slug'] || null));
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
    const article = this.article.value();
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
