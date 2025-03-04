import { Component, input } from '@angular/core';
import { Widget } from '../../shared/widget/widget.service';

@Component({
  selector: 'app-not-found',
  template: `
    <header>
      <h1>{{ data()?.componentName }} not found</h1>
    </header>
    <section>
      <p>Sorry, the widget you are looking for does not exist.</p>
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
    }
    p {
      word-break: break-word;
    }
  `,
})
export default class NotFoundComponent {
  data = input<Widget>();
}
