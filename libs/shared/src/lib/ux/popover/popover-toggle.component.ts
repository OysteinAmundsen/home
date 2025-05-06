import { Component, input } from '@angular/core';
import { PopoverAnchorDirective } from './popover-anchor.directive';
import { PopoverComponent } from './popover.component';

@Component({
  selector: 'lib-popover-toggle',
  imports: [PopoverAnchorDirective],
  template: `
    <button type="button" [libPopoverAnchor]="popoverPanel()">
      @if (icon()) {
        <span class="material-symbols-outlined">{{ icon() }}</span>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
})
export class PopoverToggleComponent {
  icon = input<string | undefined>(undefined);
  popoverPanel = input.required<PopoverComponent>();
}
