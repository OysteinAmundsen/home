export function markdownToHtml(markdown: string): string {
  // Convert markdown formatted string to html.
  markdown = markdown
    // Convert headings
    .replace(/^\s*(#{1,6})\s*(.*)$/gm, (match: any, hashes: string, text: string) => {
      const level = hashes.length;
      return `<h${level}>${text.trim()}</h${level}>`;
    })
    // Convert code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match: string, className: string, content: string) => {
      const classAttr = className ? ` class="${className}"` : '';
      return `<pre${classAttr}><code>${content}</code></pre>`;
    })
    // Convert inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert bold text
    .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
    // Convert italic text
    .replace(/(_|\*)(.*?)\1/g, '<em>$2</em>')
    // Convert strikethrough text
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Convert images
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
    // Convert links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Convert blockquotes (supports nesting)
    .replace(/^\s*((?:>\s*)+)(.*)$/gm, nestedBlocks)
    // Convert unordered and ordered lists
    .replace(/^(\s*(\d+\.\s+|[-*]\s+).*(?:\n\s*(\d+\.\s+|[-*]\s+).*)*)/gm, nestedList);

  // Wrap each line in <p> tags
  let inBlock = false;
  markdown = markdown
    .split(/\n+/) // Split by one or more newlines
    .reduce((acc: string[], line: string) => {
      // Track whether we are inside a blockquote or pre block
      if (/^<(blockquote|pre)/.test(line.trim())) {
        inBlock = true;
        acc.push(line + '\n'); // Add the line as-is
      } else if (/.*<\/(blockquote|pre)>$/.test(line.trim())) {
        inBlock = false;
        acc.push(line); // Add the line as-is
      } else if (inBlock) {
        acc.push(line + '\n'); // Add the line as-is
      } else if (/^<(h[1-6]|ul|ol)>/.test(line.trim())) {
        acc.push(line); // Add the line as-is
      } else {
        acc.push(`<p>${line}</p>`); // Wrap in <p> tags
      }
      return acc;
    }, [])
    .join('')
    .replace(/<p><\/p>/gm, '<br/>'); // Remove empty <p> tags

  return markdown;
}

function nestedBlocks(match: string, markers: string, content: string) {
  // Count the number of '>' markers (ignoring spaces)
  const depth = (markers.match(/>/g) || []).length;
  let html = content.trim();
  for (let i = 0; i < depth; i++) {
    html = `<blockquote>${html}</blockquote>`;
  }
  return html;
}

function nestedList(match: string): string {
  const lines = match.split(/\n/);
  let result = '';

  // Determine the base indentation level from the first line
  const baseIndentLevel = lines[0].match(/^\s*/)?.[0].length || 0;
  const levels = new Map<number, 'ul' | 'ol'>([]); // Map to track levels and their types

  // Iterate through each line and determine the indentation level and list type
  lines.forEach((line) => {
    const indentLevel = (line.match(/^\s*/)?.[0].length || 0) - baseIndentLevel;
    const content = line.trim().replace(/^(\d+\.\s+|[-*]\s+)/, '');
    const listType = /^\d+\./.test(line.trim()) ? 'ol' : 'ul';

    // Open a new list if the indentLevel increases or the list type changes
    if (!levels.has(indentLevel)) {
      result += `<${listType}>`;
      levels.set(indentLevel, listType);
    }
    const l = Array.from(levels.keys());
    const lastLevel = l[l.length - 1];
    if (indentLevel < lastLevel) {
      result += `</${levels.get(lastLevel)}>`;
      levels.delete(lastLevel);
    }

    result += `<li>${content}</li>`;
  });

  // Close any remaining open lists
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => b - a); // Sort levels in descending order
  sortedLevels.forEach((level) => {
    result += `</${levels.get(level)}>`;
    levels.delete(level);
  });

  return result;
}
