import { ElementRef, inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
// import { markdownToHtml } from '../utils/markdown';

@Pipe({ name: 'markdown', pure: true })
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly elm = inject(ElementRef<HTMLElement>);

  constructor() {
    this.elm.nativeElement.classList.add('markdown');
  }

  transform(markdown: any): SafeHtml {
    if (markdown === null || markdown === undefined) return markdown;
    if (typeof markdown !== 'string') markdown = `${markdown}`;

    const transformed = marked.parse(markdown, { async: false, breaks: true, gfm: true });
    return this.sanitizer.bypassSecurityTrustHtml(transformed);
  }
}
