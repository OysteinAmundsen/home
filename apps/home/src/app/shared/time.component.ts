import { Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-time',
  template: `<time>{{ time() }}</time>`,
  styles: `
    :host time {
      text-shadow: 0 0 1px rgba(0, 0, 0, 0.5);
    }
  `,
})
export class TimeComponent {
  now$ = timer(1000 - new Date().getMilliseconds(), 1000).pipe(
    switchMap(() => timer(0, 1000)),
    map(() => new Date()),
  );
  now = toSignal(this.now$);
  formatter = new Intl.DateTimeFormat('no-NB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  time = computed(() => this.formatter.format(this.now()));
}
