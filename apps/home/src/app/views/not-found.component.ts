import { Component, input } from '@angular/core';
import { Widget } from '../shared/widget/widget.service';

@Component({
  selector: 'app-not-found',
  template: `{{ data()?.componentName }} not found`,
})
export default class NotFoundComponent {
  data = input<Widget>();
}
