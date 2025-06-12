import { ArticleQueryDto, ArticleResponseDto, CreateArticleDto, UpdateArticleDto } from '@home/shared/blog/dto';
import { ArticleStatus } from '@home/shared/blog/enums';
import { Article, PaginatedResponse } from '@home/shared/blog/interfaces';
import { slugify } from '@home/shared/utils/string';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ArticlesService {
  private readonly articlesFile = join(process.cwd(), 'apps', 'blog', 'public', 'articles.json');
  private readonly uploadsDir = join(process.cwd(), 'apps', 'blog', 'public', 'article-images');
  private readonly logger = new Logger(ArticlesService.name);

  private async ensureDirectories(): Promise<void> {
    const publicDir = join(process.cwd(), 'apps', 'blog', 'public');
    const articleImagesDir = join(publicDir, 'article-images');
    await Promise.all([
      fs.mkdir(publicDir, { recursive: true }),
      fs.mkdir(articleImagesDir, { recursive: true }),
      fs.access(this.articlesFile).catch(() => fs.writeFile(this.articlesFile, JSON.stringify([]))),
    ]);
  }

  private async loadAllArticles(): Promise<Article[]> {
    await this.ensureDirectories();
    try {
      const articlesData = await fs.readFile(this.articlesFile, 'utf-8');
      return JSON.parse(articlesData);
    } catch (error) {
      console.error('Error loading articles:', error);
      return [];
    }
  }

  private async saveAllArticles(articles: Article[]): Promise<void> {
    await fs.writeFile(this.articlesFile, JSON.stringify(articles, null, 2));
  }

  /**
   * Get all articles with admin functionality (includes all statuses with filtering)
   */
  async findAll(query: ArticleQueryDto): Promise<PaginatedResponse<Article>> {
    let articles = await this.loadAllArticles();

    // Filter by status
    if (query.status) {
      articles = articles.filter((article) => article.status === query.status);
    }

    // Filter by search term
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm) || article.content.toLowerCase().includes(searchTerm),
      );
    }

    // Sort by creation date (newest first)
    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;
    const paginatedArticles = articles.slice(offset, offset + limit);

    return {
      data: paginatedArticles,
      total: articles.length,
      page,
      limit,
      totalPages: Math.ceil(articles.length / limit),
      hasNext: page < Math.ceil(articles.length / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Get a single published article by slug
   * This is used for static page generation
   */
  async findBySlug(slug: string): Promise<ArticleResponseDto> {
    const article = (await this.loadAllArticles()).find((a) => a.slug === slug);

    if (!article) {
      throw new NotFoundException(`Published article with slug "${slug}" not found`);
    }

    return article;
  }

  /**
   * Create a new article (Admin functionality)
   */
  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const articles = await this.loadAllArticles();
    const id = Date.now().toString();
    const slug = slugify(createArticleDto.title);

    // Check if slug already exists
    const existingArticle = articles.find((a) => a.slug === slug);
    if (existingArticle) {
      throw new BadRequestException(`Article with slug "${slug}" already exists`);
    }

    const article: Article = {
      id,
      title: createArticleDto.title,
      slug,
      content: createArticleDto.content,
      status: createArticleDto.status || ArticleStatus.DRAFT,
      featuredImage: createArticleDto.featuredImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    articles.push(article);
    await this.saveAllArticles(articles);

    return article;
  }

  /**
   * Update an existing article (Admin functionality)
   */
  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const articles = await this.loadAllArticles();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) throw new NotFoundException(`Article with id "${id}" not found`);

    let article = articles[idx];

    if (dto.title && dto.title !== article.title) {
      const newSlug = slugify(dto.title);
      if (articles.some((a) => a.slug === newSlug && a.id !== id))
        throw new BadRequestException(`Article with slug "${newSlug}" already exists`);
      article.slug = newSlug;
    }

    article = { ...article, ...dto, updatedAt: new Date() };
    articles[idx] = article;
    await this.saveAllArticles(articles);
    await this.cleanupOrphanedImages();
    return article;
  }

  /**
   * Delete an article (Admin functionality)
   */
  async remove(id: string): Promise<void> {
    const articles = await this.loadAllArticles();
    const articleIndex = articles.findIndex((article) => article.id === id);

    if (articleIndex === -1) {
      throw new NotFoundException(`Article with id "${id}" not found`);
    }

    // Remove article from array
    articles.splice(articleIndex, 1);

    // Save updated articles
    await this.saveAllArticles(articles);

    // Clean up orphaned images after article deletion
    await this.cleanupOrphanedImages();
  }

  /**
   * Get all image filenames currently used by articles,
   * including featured images and images embedded in article content.
   */
  private async getUsedImageFilenames(): Promise<Set<string>> {
    const articles = await this.loadAllArticles();
    const used = new Set<string>();
    const extractFilename = (url?: string) => url?.match(/\/article-images\/(.+)$/)?.[1] ?? null;

    for (const a of articles) {
      // Add featured image if present
      const featured = extractFilename(a.featuredImage);
      if (featured) used.add(featured);

      // Add images from markdown and HTML img tags
      const content = a.content ?? '';
      // Markdown: ![alt](/article-images/filename.jpg)
      for (const m of content.matchAll(/!\[.*?\]\(([^)]+)\)/g)) {
        const f = extractFilename(m[1]);
        if (f) used.add(f);
      }
      // HTML: <img src="/article-images/filename.jpg" ...>
      for (const m of content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
        const f = extractFilename(m[1]);
        if (f) used.add(f);
      }
    }
    return used;
  }

  /**
   * Manual cleanup method to remove all orphaned images
   * Can be called periodically or as needed
   */
  private async cleanupOrphanedImages(): Promise<{ deletedCount: number; deletedFiles: string[] }> {
    try {
      const usedImages = await this.getUsedImageFilenames();
      const uploadFiles = await fs.readdir(this.uploadsDir);
      const imageFiles = uploadFiles.filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
      const orphanedImages = imageFiles.filter((f) => !usedImages.has(f));
      const deletedFiles: string[] = [];

      await Promise.all(
        orphanedImages.map(async (file) => {
          const filePath = join(this.uploadsDir, file);
          try {
            await fs.unlink(filePath);
            deletedFiles.push(file);
            this.logger.log(`Cleaned up orphaned image: ${file}`);
          } catch (e) {
            this.logger.warn(`Failed to delete orphaned image ${file}: ${e instanceof Error ? e.message : e}`);
          }
        }),
      );

      this.logger.log(`Manual cleanup completed: ${deletedFiles.length} orphaned image(s) removed`);
      return { deletedCount: deletedFiles.length, deletedFiles };
    } catch (e) {
      this.logger.error(`Error during manual image cleanup: ${e instanceof Error ? e.message : e}`);
      return { deletedCount: 0, deletedFiles: [] };
    }
  }
}
