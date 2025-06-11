import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Article } from '@home/shared/blog/interfaces/article.interface';

@Component({
  selector: 'app-article-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.scss',
})
export class ArticleCardComponent {
  article = input.required<Article>();
  // Computed signals for derived values
  readingTime = computed(() => {
    const wordsPerMinute = 200;
    const textContent = this.article().content;
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  });

  excerpt = computed(() => {
    const content = this.article().content;
    if (!content) return '';

    // Extract first paragraph from markdown
    const lines = content.split('\n');
    const firstParagraph = lines.find((line) => line.trim() && !line.startsWith('#'));
    if (!firstParagraph) return '';

    const maxLength = 150;
    if (firstParagraph.length <= maxLength) return firstParagraph;

    return firstParagraph.substring(0, maxLength).trim() + '...';
  });

  formatDate(): string {
    const date = this.article().createdAt;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateForAttribute(): string {
    const date = this.article().createdAt;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
  }
}
