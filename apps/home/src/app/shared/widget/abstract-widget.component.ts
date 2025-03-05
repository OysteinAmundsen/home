import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  makeStateKey,
  PLATFORM_ID,
  Signal,
  signal,
  TransferState,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { titleCase } from '../utils/string';
import { Widget, WidgetService } from './widget.service';

const WIDGET_KEY = makeStateKey<any>('widget-host');
/**
 * Base class for all widget components.
 */
@Directive({
  host: {
    class: 'widget',
    '[class.fullscreen]': 'isFullscreen()',
    // '[style.--widget-id]': 'widgetId()',
  },
})
export abstract class AbstractWidgetComponent {
  protected readonly elementRef = inject(ElementRef);
  protected readonly widgetService = inject(WidgetService);
  protected readonly router = inject(Router);
  protected readonly destroyRef$ = inject(DestroyRef);
  protected transferState = inject(TransferState);
  protected readonly platformId = inject(PLATFORM_ID);

  abstract id: Signal<string>;
  protected widgetConfig = computed(() =>
    this.widgetService.getRoute(this.id()),
  );

  data = input<Widget>();
  host = signal(this);
  resolvedData = computed(() => {
    const data = this.data();
    if (data) return data;

    const resolved = this.widgetConfig();
    return resolved
      ? {
          id: -1,
          componentName: resolved.path,
          name: titleCase(`${resolved.path}`),
        }
      : undefined;
  });

  isFullscreen = toSignal<boolean>(
    this.router.events.pipe(
      takeUntilDestroyed(this.destroyRef$),
      filter((event) => event instanceof NavigationEnd),
      map(() => !this.widgetService.isDescendantOfWidget(this.elementRef)),
    ),
  );

  constructor() {
    if (isPlatformServer(this.platformId)) {
      // On the server, set the widget data
      this.host.set(this);
      this.transferState.set(WIDGET_KEY, this.host);
    } else if (isPlatformBrowser(this.platformId)) {
      // On the client, retrieve the widget data
      this.host.set(this.transferState.get(WIDGET_KEY, this));
    }
  }
}
