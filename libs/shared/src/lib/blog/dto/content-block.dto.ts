import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentBlockType } from '../enums/content-block-type.enum';

export class ContentBlockDto {
  @ApiProperty({
    description: 'Type of content block',
    enum: ContentBlockType,
    example: ContentBlockType.PARAGRAPH,
  })
  @IsEnum(ContentBlockType)
  type!: ContentBlockType;

  @ApiProperty({
    description: 'Text content of the block',
    example: 'This is a paragraph of content.',
  })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({
    description: 'Alt text for images',
    example: 'Description of the image',
    required: false,
  })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiProperty({
    description: 'URL for images',
    example: '/api/uploads/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  src?: string;
}
