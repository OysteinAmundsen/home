import { Component, input } from '@angular/core';
import { Widget } from '../shared/widget/widget.service';

@Component({
  selector: 'app-widget1',
  template: `TEST WIDGET: {{ data()?.componentName }}`,
})
export class Widget1Component {
  data = input<Widget>();
}
