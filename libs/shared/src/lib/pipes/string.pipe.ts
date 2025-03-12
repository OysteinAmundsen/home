import { Pipe, PipeTransform } from '@angular/core';
import { camelCase, kebabCase, pascalCase, sentenceCase, snakeCase, titleCase } from '../utils/string';

@Pipe({ name: 'string', pure: true })
export class StringPipe implements PipeTransform {
  transform(value: string, type?: string): string {
    switch (type) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'camelCase':
        return camelCase(value);
      case 'titleCase':
        return titleCase(value);
      case 'kebabCase':
        return kebabCase(value);
      case 'snakeCase':
        return snakeCase(value);
      case 'pascalCase':
        return pascalCase(value);
      case 'sentenceCase':
        return sentenceCase(value);
    }

    return String(value);
  }
}
