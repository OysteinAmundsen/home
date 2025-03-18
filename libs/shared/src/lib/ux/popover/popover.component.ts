import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

let id = 0;

@Component({
  selector: 'lib-popover',
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styles: `
    $xStart: -90deg;
    $yStart: 0;
    $zStart: 0;
    :host {
      position-anchor: var(--anchor);
      z-index: 100;
      left: auto;
      bottom: auto;
      right: anchor(right);
      top: calc(anchor(bottom) + 0.5rem);
      padding: 1rem;
      transition:
        transform var(--animation-duration) ease-in-out,
        rotate var(--animation-duration) ease-in-out,
        opacity var(--animation-duration) ease-in-out,
        scale var(--animation-duration) ease-in-out,
        display var(--animation-duration) allow-discrete; // This enables close transition
      background-color: var(--color-background);
      transform-origin: top right;
      border-radius: var(--border-radius);
      border: 2px solid var(--color-border-focused);

      // Will animate back to these on close
      transform: rotateX($xStart) rotateY($yStart) rotateZ($zStart);
      scale: 0.2;
      opacity: 0.3;

      &:popover-open {
        transform: rotateX(0) rotateY(0) rotateZ(0);
        scale: 1;
        opacity: 1;

        border: 2px solid var(--color-border-focused);

        // Will animate from these on open
        @starting-style {
          transform: rotateX($xStart) rotateY($yStart) rotateZ($zStart);
          scale: 0.2;
          opacity: 0.3;
        }
      }
    }
  `,
  host: {
    class: 'popover-panel',
    '[id]': 'uniqueId()',
    '[style.--anchor]': '"--" + uniqueId()',
    '[popover]': '"auto"',
  },
})
export class PopoverComponent {
  uniqueId = signal(`popover-${id++}`);
}
