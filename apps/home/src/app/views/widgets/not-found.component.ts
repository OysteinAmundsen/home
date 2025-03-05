import { Component, signal } from '@angular/core';
import { AbstractWidgetComponent } from '../../shared/widget/abstract-widget.component';
import { WidgetComponent } from '../../shared/widget/widget.component';

@Component({
  selector: 'app-not-found',
  imports: [WidgetComponent],
  template: `
    <app-widget [host]="host()">
      <header>
        <h1>{{ resolvedData()?.componentName }} not found</h1>
      </header>
      <section>
        <p>Sorry, the widget you are looking for does not exist.</p>
      </section>
    </app-widget>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      ::ng-deep .widget-content {
        place-content: center;
        place-items: center;
      }
    }
    p {
      word-break: break-word;
    }
  `,
})
export default class NotFoundComponent extends AbstractWidgetComponent {
  id = signal('not-found');
  // data = input<Widget>();
}
