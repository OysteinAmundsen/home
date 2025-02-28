import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  Injectable,
  Injector,
  NgModuleFactory,
  resource,
  signal,
  Type,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { widgetRoutes } from '../../views/widget.routes';
import { cache } from '../rxjs/cache';
import { DefaultExport } from '@angular/router';

export type Widget = {
  id: number;
  name: string;
  componentName: string;
};

@Injectable({ providedIn: 'root' })
export class WidgetService {
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private widgetRoutes = widgetRoutes;

  /** Filter widgets by id */
  filter = signal<number | undefined>(undefined);

  /** Fetches the widgets from the server */
  private widgetsCache = [] as Widget[];
  private widgetsLoader = resource({
    // Triggers
    request: () => ({ id: this.filter() }),
    // Actions
    loader: async ({ request }) => {
      // Cannot use fetch directly because Angular's SSR does not support it.
      // I get a `TypeError: Failed to parse URL` from SSR when using fetch.
      const cacheKey = () =>
        `/api/widgets${request.id ? '/' + request.id : ''}`;
      const widgets = await firstValueFrom(
        cache(() => this.http.get<Widget[]>(cacheKey()), { cacheKey }),
      );

      // Remove old widgets from the cache
      this.widgetsCache = this.widgetsCache.filter((widget) =>
        widgets.find((w) => w.id === widget.id),
      );

      // Add new widgets to the cache
      widgets.forEach((widget) => {
        if (!this.widgetsCache.find((w) => w.id === widget.id)) {
          this.widgetsCache.push(widget);
        }
      });

      return this.widgetsCache.sort((a, b) => a.id - b.id);
    },
  });

  widgets = computed<Widget[]>(() =>
    // Make sure that widgets always returns an array, even when loading new widgets
    this.widgetsLoader.isLoading()
      ? this.widgetsCache
      : (this.widgetsLoader.value() as Widget[]),
  );
  error = computed<string | undefined>(
    () =>
      (this.widgetsLoader.error() as HttpErrorResponse)?.error.error ??
      undefined,
  );
  isLoading = computed(
    () => this.widgetsLoader.isLoading() && this.widgets.length < 1,
  );

  /**
   * This acts as a repository for the widgets.
   *
   * It will lookup the widget in the widgetRoutes and try to
   * load the component. If the component is not found or it fails
   * to load, it will return the NotFoundComponent.
   *
   * @param componentName
   * @returns
   */
  async loadWidget(componentName: string | undefined) {
    const route = this.widgetRoutes.find(
      (route) => route.path === componentName,
    );
    if (
      route &&
      'loadChildren' in route &&
      typeof route.loadChildren === 'function'
    ) {
      try {
        const moduleOrComponent = await route.loadChildren();
        if (moduleOrComponent instanceof NgModuleFactory) {
          // Should not be a module, but if it is we will try to get the default component
          const moduleRef = moduleOrComponent.create(this.injector);
          const component = moduleRef.instance.default;
          return component;
        }
        return moduleOrComponent;
      } catch (error) {
        console.error(error);
      }
    }
    return (await import('../../views/not-found.component')).default;
  }
}
