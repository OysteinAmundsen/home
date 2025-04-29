import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[libColorCodeNumber]',
})
export class ColorCodeNumberDirective {
  private readonly elm = inject(ElementRef);

  // Read the element value and color code it green if positive, red if negative
  constructor() {
    afterNextRender(() => {
      const value = Number(this.elm.nativeElement.innerText);
      if (isNaN(value)) return;
      const color = value > 0 ? 'var(--color-success)' : value < 0 ? 'var(--color-warn)' : '';
      this.elm.nativeElement.style.color = color;
    });
  }
}
