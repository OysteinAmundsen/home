import { ElementRef, inject, Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
// import { markdownToHtml } from '../utils/markdown';

@Pipe({ name: 'markdown', pure: true })
export class MarkdownPipe implements PipeTransform {
  elm = inject(ElementRef<HTMLElement>);

  constructor() {
    this.elm.nativeElement.classList.add('markdown');
  }

  transform(markdown: any): string {
    if (markdown === null || markdown === undefined) return markdown;
    if (typeof markdown !== 'string') markdown = `${markdown}`;

    return marked.parse(markdown, { async: false });
  }
}
