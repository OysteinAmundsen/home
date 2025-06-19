import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, OnInit, resource, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleStatus } from '@home/shared/blog/enums';
import { MarkdownPipe } from '@home/shared/pipes/markdown.pipe';
import { SnackbarService } from '@home/shared/ux/snackbar/snackbar.service';
import { LoadingSpinnerComponent } from '@home/shared/ux/spinner/loading-spinner.component';
import { ArticleService } from '../../../../services/article.service';

@Component({
  selector: 'app-article-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MarkdownPipe, LoadingSpinnerComponent],
  templateUrl: './article-editor.component.html',
  styleUrl: './article-editor.component.scss',
})
export class ArticleEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly articleService = inject(ArticleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(SnackbarService);

  markdownEditor = viewChild('markdownEditor'); // Track if form has changes
  private initialFormValue: Record<string, unknown> | null = null;
  hasUnsavedChanges = computed(() => {
    if (!this.initialFormValue) return false;
    const currentValue = this.articleForm.value;
    return JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue);
  });

  // Image upload properties
  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  defaultContent = `# Your Article Title

## Introduction

Write your introduction here...

## Main Content

Add your main content here with **bold text**, *italic text*, and [links](https://example.com).

### Subsection

- List item 1
- List item 2
- List item 3

> This is a blockquote for important information.

\`\`\`javascript
// Code blocks are also supported
console.log('Hello, world!');
\`\`\`

## Conclusion

Wrap up your article here.
`;

  articleForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    featuredImage: [''],
    content: [this.defaultContent, [Validators.required]],
    status: [ArticleStatus.DRAFT, [Validators.required]],
  });

  articleId = signal<string | null>(null);
  isEditMode = computed(() => !!this.articleId());
  isSaving = signal(false);
  showPreview = signal(true);
  article = resource({
    params: () => this.articleId(),
    loader: async ({ params }) => {
      if (!params) {
        // Set initial form value for new article
        this.initialFormValue = this.articleForm.value;
        return null;
      }
      const article = await this.articleService.getArticleById(params);
      if (!article) {
        throw new Error('Article not found');
      }
      const formValue = {
        title: article.title,
        featuredImage: article.featuredImage || '',
        content: article.content,
        status: article.status,
      };
      this.articleForm.patchValue(formValue);

      // Set image preview if there's an existing featured image
      if (article.featuredImage) {
        this.imagePreviewUrl.set(article.featuredImage);
      }

      // Set initial form value after loading article
      this.initialFormValue = this.articleForm.value;
      return article;
    },
  });
  onArticleError = effect(() => {
    if (this.article.error()) {
      console.error('Error loading article:', this.article.error());
      this.snackBar.open('Error loading article', 'error', { duration: 5000 });
      this.router.navigate(['/admin/articles']);
      return;
    }
  });

  // Make enums accessible in template
  ArticleStatus = ArticleStatus;
  ngOnInit() {
    this.articleId.set(this.route.snapshot.paramMap.get('id'));
    // Set initial form value for new articles
    if (!this.articleId()) {
      setTimeout(() => {
        this.initialFormValue = this.articleForm.value;
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Only image files are allowed (JPEG, PNG, WebP, GIF)', 'warn', { duration: 5000 });
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.snackBar.open('File size must be less than 5MB', 'warn', { duration: 5000 });
        return;
      }

      this.selectedFile.set(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile.set(null);
    this.imagePreviewUrl.set(null);
    this.articleForm.patchValue({ featuredImage: '' });
  }

  togglePreview() {
    this.showPreview.set(!this.showPreview());
  }

  saveDraft() {
    this.saveArticle(ArticleStatus.DRAFT);
  }

  publish() {
    this.saveArticle(ArticleStatus.PUBLISHED);
  }
  private async saveArticle(status: ArticleStatus) {
    if (this.articleForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'warn', { duration: 5000 });
      return;
    }

    this.isSaving.set(true);

    try {
      let featuredImageUrl = this.articleForm.value.featuredImage;
      // Upload file if one is selected
      if (this.selectedFile()) {
        const selectedFile = this.selectedFile();
        if (selectedFile) {
          const uploadResult = await this.articleService.uploadFile(selectedFile);
          featuredImageUrl = uploadResult.url;
        }
      }

      const articleData = {
        ...this.article.value(),
        ...this.articleForm.value,
        featuredImage: featuredImageUrl,
        status,
      };

      if (this.isEditMode()) {
        await this.articleService.updateArticle(articleData.id, articleData);
        this.snackBar.open('Article updated successfully!', 'info', { duration: 5000 });
      } else {
        await this.articleService.createArticle(articleData);
        this.snackBar.open('Article created successfully!', 'info', { duration: 5000 });
      }
      // Update initial form value after successful save
      this.initialFormValue = this.articleForm.value;
      this.router.navigate(['/admin/articles']);
    } catch (error) {
      console.error('Error saving article:', error);
      this.snackBar.open('Error saving article. Please try again.', 'error', { duration: 5000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  async goBack() {
    if (await this.confirmDiscardChanges()) {
      this.router.navigate(['/admin/articles']);
    }
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    if (!this.hasUnsavedChanges()) {
      return true;
    }

    const confirmed = window.confirm('You have unsaved changes. Are you sure you want to discard them and continue?');
    return confirmed;
  }
}
