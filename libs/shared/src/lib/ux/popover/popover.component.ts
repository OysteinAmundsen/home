import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal } from '@angular/core';

let id = 0;

@Component({
  selector: 'lib-popover',
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.scss',
  imports: [CommonModule],
  host: {
    class: 'popover-panel',
    '[class.open]': 'isOpen()',
    '[style.--anchor]': '"--" + uniqueId()',
  },
})
export class PopoverComponent {
  readonly el = inject(ElementRef);

  uniqueId = signal(`popover-${id++}`);
  state = signal<'open' | 'closed'>('closed');
  isOpen = computed(() => this.state() === 'open');

  toggle() {
    this.state.update((state) => (state === 'open' ? 'closed' : 'open'));
  }
}
