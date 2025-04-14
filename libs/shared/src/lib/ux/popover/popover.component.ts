import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, PLATFORM_ID, signal } from '@angular/core';

let id = 0;

@Component({
  selector: 'lib-popover',
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    class: 'popover-panel',
    '[id]': 'uniqueId()',
    '[style.--anchor]': '"--" + uniqueId()',
    '[popover]': '"auto"',
  },
})
export class PopoverComponent {
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  uniqueId = signal(`popover-${id++}`);

  hideOn = input<'auto' | 'click'>('auto');

  open() {
    (this.el.nativeElement as HTMLElement).showPopover();
  }
  close() {
    const elm = this.el.nativeElement as HTMLElement;
    if (isPlatformBrowser(this.platformId) && elm.matches(':popover-open')) {
      elm.hidePopover();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.hideOn() === 'click') {
      this.close();
    }
  }
}
