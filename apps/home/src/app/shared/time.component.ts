import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { VisibilityService } from './visibility/visibility.service';

@Component({
  selector: 'app-time',
  template: `<time>{{ time() }}</time>`,
  styles: `
    :host {
      display: flex;
      place-items: center;
      height: 100%;
    }
  `,
})
export class TimeComponent {
  private readonly visibility = inject(VisibilityService);
  private isVisible$ = toObservable(this.visibility.isBrowserActive);
  // Timer that emits the current time every second on the second
  // But only if the page is currently active. This saves CPU cycles
  // when user is not actively using the page.
  private now$ = this.isVisible$.pipe(
    distinctUntilChanged(),
    switchMap((isRunning) =>
      isRunning
        ? timer(1000 - new Date().getMilliseconds(), 1000).pipe(
            switchMap(() => timer(0, 1000)),
            map(() => new Date()),
          )
        : [],
    ),
  );
  // The current time as a signal
  private now = toSignal(this.now$);

  // INTL formatter for date and time
  private formatter = new Intl.DateTimeFormat('no-NB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  /** The current time formatted as a string */
  time = computed(() => this.formatter.format(this.now()));
}
