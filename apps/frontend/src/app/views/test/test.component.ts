import { Component } from '@angular/core';
import { MarkdownPipe } from '@home/shared/pipes/markdown.pipe';

@Component({
  selector: 'app-test',
  imports: [MarkdownPipe],
  template: ` <div [innerHTML]="markdownText | markdown"></div>`,
})
export class TestComponent {
  markdownText = `
    # This is a test document
    ## It should showcase the markdown pipe
    ### Header 3
    #### Header 4
    ##### Header 5
    ###### Header 6
    There should not be any characters before a # header
    This is a paragraph with some text.
    This is a **bold**, _italic_ and ~~strikethrough~~ text.

    This is a [link](https://example.com)
    This is an ![image](http://localhost:4200/api/background).
    This is a \`code\` text.

    \`\`\`codeblock
    function test() {
      console.log("Hello, World!");
    }
    \`\`\`

    This is an unordered list:
    * Item 1
    * Item 2
      * Sub-Item 1
      * Sub-Item 2
    * Item 3

    This is an ordered list:
    1. Item 1
    2. Item 2
      * Sub-Item 1
      * Sub-Item 2
    3. Item 3
      1. Sub-Item 1
      2. Sub-Item 2

    > This is a blockquote text.
  `;
}
