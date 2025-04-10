import { Component, input } from '@angular/core';
import { PopoverAnchorDirective } from './popover-anchor.directive';
import { PopoverComponent } from './popover.component';

@Component({
  selector: 'lib-popover-toggle',
  imports: [PopoverAnchorDirective],
  template: `
    <button type="button" [libPopoverAnchor]="popoverPanel()">
      <span class="material-symbols-outlined">{{ icon() }}</span>
    </button>
  `,
})
export class PopoverToggleComponent {
  icon = input<string>('more_vert');
  popoverPanel = input.required<PopoverComponent>();
}
