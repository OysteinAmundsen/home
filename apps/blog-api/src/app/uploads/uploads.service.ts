import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join } from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadsDir = join(process.cwd(), 'apps', 'blog', 'public', 'article-images');

  constructor() {
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch {
      console.error('Error creating uploads directory');
    }
  }

  private generateFileName(originalName: string) {
    const ext = extname(originalName);
    return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException('Only image files are allowed');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('File size must be less than 5MB');

    const filename = this.generateFileName(file.originalname);
    const filePath = join(this.uploadsDir, filename);
    try {
      await fs.writeFile(filePath, file.buffer);
      return { filename, originalName: file.originalname, url: `/article-images/${filename}` };
    } catch {
      throw new BadRequestException('Failed to save file');
    }
  }

  async getFile(filename: string) {
    const filePath = join(this.uploadsDir, filename);
    try {
      await fs.access(filePath);
      return { filePath, exists: true };
    } catch {
      return { filePath, exists: false };
    }
  }

  async deleteFile(filename: string) {
    const filePath = join(this.uploadsDir, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }
  }
}
