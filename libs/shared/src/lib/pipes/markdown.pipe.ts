import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'markdown', pure: true })
export class MarkdownPipe implements PipeTransform {
  transform(value: any, type?: string): string {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') value = `${value}`;

    // Convert markdown formatted string to html.
    value = value
      // Convert headings
      .replace(/^(#{1,6})\s*(.*)$/gm, (match: any, hashes: string, text: string) => {
        const level = hashes.length;
        return `<h${level}>${text.trim()}</h${level}>`;
      })
      // Convert code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Convert inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic text
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert strikethrough text
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Convert blockquotes
      .replace(/^>\s*(.*)$/gm, '<blockquote>$1</blockquote>')
      // Convert unordered and ordered lists
      .replace(/^(\s*[-*]\s+.*(?:\n\s*[-*]\s+.*)*)/gm, (match: string) => {
        const items = match.split(/\n/).map((item) => item.replace(/^\s*[-*]\s+/, '<li>') + '</li>');
        return `<ul>${items.join('')}</ul>`;
      })
      .replace(/^(\d+\.\s+.*(?:\n\d+\.\s+.*)*)/gm, (match: string) => {
        const items = match.split(/\n/).map((item) => item.replace(/^\d+\.\s+/, '<li>') + '</li>');
        return `<ol>${items.join('')}</ol>`;
      })
      // Convert images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
      // Convert links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      // Convert new lines to <br />
      .replace(/\n\n/g, '<br />');

    return value;
  }
}
