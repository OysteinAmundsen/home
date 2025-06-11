import { ContentBlockType } from '../enums/content-block-type.enum';

export interface ContentBlock {
  id?: string;
  type: ContentBlockType;
  order?: number;
  text?: string; // For subtitle and paragraph content
  src?: string; // For image source
  alt?: string; // For image alt text
  caption?: string; // For image caption
  width?: number; // For image width
  height?: number; // For image height
  level?: 2 | 3 | 4 | 5 | 6; // For subtitle level (h2-h6)
}

export interface SubtitleBlock extends ContentBlock {
  type: ContentBlockType.SUBTITLE;
  text: string;
  level: 2 | 3 | 4 | 5 | 6; // h2-h6
}

export interface ParagraphBlock extends ContentBlock {
  type: ContentBlockType.PARAGRAPH;
  text: string; // HTML content
}

export interface ImageBlock extends ContentBlock {
  type: ContentBlockType.IMAGE;
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}
