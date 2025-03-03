import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Widget, WidgetService } from './widget.service';

/**
 * Base class for all widget components.
 */
@Directive({
  host: {
    class: 'widget',
    '[class.fullscreen]': 'isFullscreen()',
  },
})
export abstract class AbstractWidgetComponent {
  protected readonly elementRef = inject(ElementRef);
  protected readonly widgetService = inject(WidgetService);
  protected readonly router = inject(Router);
  protected readonly destroyRef$ = inject(DestroyRef);

  data = input<Widget>();

  isFullscreen = toSignal(
    this.router.events.pipe(
      takeUntilDestroyed(this.destroyRef$),
      filter((event) => event instanceof NavigationEnd),
      map(() => !this.widgetService.isDescendantOfWidget(this.elementRef)),
    ),
  );
}
