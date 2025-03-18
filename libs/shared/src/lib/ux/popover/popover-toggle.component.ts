import { Component, computed, input } from '@angular/core';
import { PopoverComponent } from './popover.component';

@Component({
  selector: 'lib-popover-toggle',
  template: `
    @if (popoverPanel()) {
      <button
        type="button"
        class="popover-toggle"
        [attr.popovertarget]="popoverPanel()?.uniqueId()"
        [style]="'anchor-name: --' + popoverPanel()?.uniqueId()"
        popovertargetaction="toggle"
      >
        <span class="material-symbols-outlined">more_vert</span>
      </button>
    }
  `,
})
export class PopoverToggleComponent {
  popoverPanel = input<PopoverComponent>();

  isOpen = computed(() => this.popoverPanel()?.isOpen() ?? false);
}
