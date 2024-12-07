import { Component, input } from '@angular/core';
import { Widget } from '../shared/widget/widget.service';

@Component({
  selector: 'app-widget2',
  template: `WIDGET 2`,
})
export class Widget2Component {
  data = input<Widget>();
}
