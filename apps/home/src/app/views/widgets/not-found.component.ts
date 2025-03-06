import { Component, signal } from '@angular/core';
import { AbstractWidgetComponent } from '../../shared/widget/abstract-widget.component';
import { WidgetComponent } from '../../shared/widget/widget.component';

/**
 * A "cacth-all" widget to display if a requested widget is not found
 * 
 * In order to find a widget, a widget must be registerred in the 
 * `widget.routes.ts` file.
 */
@Component({
  selector: 'app-not-found',
  imports: [WidgetComponent],
  template: `
    <app-widget [host]="host()">
      <header>
        <h1>{{ widgetName() }} not found</h1>
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
