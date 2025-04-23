/**
 * Credit: https://notiz.dev/blog/type-safe-file-uploads
 */
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export interface ApiFileOptions {
  fieldName?: string;
  description?: string;
  required?: boolean;
  localOptions?: MulterOptions;
}
export function ApiFile(opts: ApiFileOptions) {
  const { fieldName = 'file', description, required = false, localOptions = {} } = opts as ApiFileOptions;
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, localOptions)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
            description,
          },
        },
      },
    }),
  );
}
