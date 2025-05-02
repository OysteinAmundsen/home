import { markdownToHtml } from './markdown';

describe('markdownToHtml', () => {
  describe('regular text', () => {
    it('should convert headers', () => {
      const input = '# Header 1\n## Header 2\n### Header 3';
      const expected = '<h1>Header 1</h1><h2>Header 2</h2><h3>Header 3</h3>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should not convert to headers when there are characters before the "#"', () => {
      const input = 'Not a # Header';
      const expected = '<p>Not a # Header</p>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should convert bold, italic, and strikethrough text', () => {
      const input = 'This is **bold**, _italic_, and ~~strikethrough~~ text.';
      const expected = '<p>This is <strong>bold</strong>, <em>italic</em>, and <del>strikethrough</del> text.</p>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should convert links', () => {
      const input = 'This is a [link](https://example.com)';
      const expected = '<p>This is a <a href="https://example.com">link</a></p>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should convert images', () => {
      const input = 'This is an ![image](http://localhost:4200/api/background)';
      const expected = '<p>This is an <img src="http://localhost:4200/api/background" alt="image"></p>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should convert inline code', () => {
      const input = 'This is a `code` text.';
      const expected = '<p>This is a <code>code</code> text.</p>';
      expect(markdownToHtml(input)).toBe(expected);
    });
  });

  describe('block elements', () => {
    it('should convert code blocks', () => {
      const input = '```\nfunction test() {\n  console.log("Hello, World!");\n}\n```';
      const expected = '<pre><code>function test() {\n  console.log("Hello, World!");\n}\n</code></pre>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should give a classname to code blocks', () => {
      const input = '```javascript\nfunction test() {\n  console.log("Hello, World!");\n}\n```';
      const expected =
        '<pre class="javascript"><code>function test() {\n  console.log("Hello, World!");\n}\n</code></pre>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should place regular text in paragraphs', () => {
      const input = 'This is a paragraph.\n\nThis is another paragraph.';
      const expected = '<p>This is a paragraph.</p><p>This is another paragraph.</p>';
      expect(markdownToHtml(input)).toBe(expected);
    });
  });
  describe('list elements', () => {
    it('should convert unordered lists', () => {
      const input = '* Item 1\n* Item 2\n* Item 3';
      const expected = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should convert nested unordered lists', () => {
      const input = '* Item 1\n  * Sub-Item 1\n  * Sub-Item 2\n* Item 2';
      const expected = '<ul><li>Item 1</li><ul><li>Sub-Item 1</li><li>Sub-Item 2</li></ul><li>Item 2</li></ul>';
      expect(markdownToHtml(input)).toBe(expected);
    });

    it('should convert ordered lists', () => {
      const input = '1. Item 1\n2. Item 2\n3. Item 3';
      const expected = '<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>';
      expect(markdownToHtml(input)).toBe(expected);
    });
    it('should convert nested ordered lists', () => {
      const input = '1. Item 1\n  1. Sub-Item 1\n  2. Sub-Item 2\n2. Item 2';
      const expected = '<ol><li>Item 1</li><ol><li>Sub-Item 1</li><li>Sub-Item 2</li></ol><li>Item 2</li></ol>';
      expect(markdownToHtml(input)).toBe(expected);
    });

    // it('should handle mixed ordered and unordered lists', () => {
    //   const input = '1. Item 1\n  * Sub-Item 1\n  * Sub-Item 2\n2. Item 2\n* Item 3';
    //   const expected =
    //     '<ol><li>Item 1</li><ul><li>Sub-Item 1</li><li>Sub-Item 2</li></ul><li>Item 2</li></ol><ul><li>Item 3</li></ul>';
    //   expect(markdownToHtml(input)).toBe(expected);
    // });
  });
});
