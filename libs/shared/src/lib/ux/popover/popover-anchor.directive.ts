import { Directive, input } from '@angular/core';
import { PopoverComponent } from './popover.component';

@Directive({
  selector: '[libPopoverAnchor]',
  host: {
    class: 'popover-toggle',
    '[attr.popovertarget]': 'popoverPanel().uniqueId()',
    '[style.anchor-name]': "'--' + popoverPanel().uniqueId()",
    '[popovertargetaction]': 'toggle',
  },
})
export class PopoverAnchorDirective {
  popoverPanel = input.required<PopoverComponent>({ alias: 'libPopoverAnchor' });
}
