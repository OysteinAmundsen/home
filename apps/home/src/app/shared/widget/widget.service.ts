import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, ElementRef, inject, Injectable, Injector, NgModuleFactory, resource, signal } from '@angular/core';
import { Route } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { widgetRoutes } from '../../views/widget.routes';
import { cache } from '../rxjs/cache';

export type Widget = {
  id: number;
  name: string;
  componentName: string;
};

@Injectable({ providedIn: 'root' })
export class WidgetService {
  private http = inject(HttpClient);
  private injector = inject(Injector);

  // The routes for the widgets
  private widgetRoutes = widgetRoutes;

  /** Filter widgets by id */
  filter = signal<number | undefined>(undefined);

  /** The url to load widgets from */
  url = computed(() => (this.filter() ? `/api/widgets/${this.filter()}` : '/api/widgets'));

  /** Fetches the widgets from the server */
  private widgetsCache = [] as Widget[];
  private widgetsLoader = resource({
    // Triggers
    request: () => this.url(),
    // Actions
    loader: async ({ request }) => {
      // Cannot use fetch directly because Angular's SSR does not support it.
      // I get a `TypeError: Failed to parse URL` from SSR when using fetch.
      const widgets = await firstValueFrom(cache(() => this.http.get<Widget[]>(request), request));

      // Remove old widgets from the cache
      this.widgetsCache = this.widgetsCache.filter((widget) => widgets.find((w) => w.id === widget.id));

      // Add new widgets to the cache
      widgets.forEach((widget) => {
        if (!this.widgetsCache.find((w) => w.id === widget.id)) {
          this.widgetsCache.push(widget);
        }
      });

      return this.widgetsCache.sort((a, b) => a.id - b.id);
    },
  });

  /** Exposes either the cached or loaded widgets */
  widgets = computed<Widget[]>(() =>
    // Make sure that widgets always returns an array, even when loading new widgets
    this.widgetsLoader.isLoading() ? this.widgetsCache : (this.widgetsLoader.value() as Widget[]),
  );

  /** Exposes any errors from the loading process */
  error = computed<string | undefined>(
    () => (this.widgetsLoader.error() as HttpErrorResponse)?.error.error ?? undefined,
  );

  /** Exposes the loading state */
  isLoading = computed(() => this.widgetsLoader.isLoading() && this.widgets.length < 1);

  /**
   * Check if this element is used in the dashboard or not.
   *
   * If this returns false, the element is probably viewed in "fullscreen" mode.
   *
   * @param elementRef The element to check
   * @returns true if the element is a descendant of a widget loader
   */
  isDescendantOfWidget(elementRef: ElementRef<HTMLElement>) {
    const element = elementRef.nativeElement;
    return element.closest('app-widget-loader') !== null;
  }

  /**
   * Lookup a component name in the widget routes
   *
   * @param componentName The component to lookup
   * @returns the Route config for this component
   */
  getRoute(componentName: string | undefined): Route | undefined {
    if (!componentName) return undefined;
    return this.widgetRoutes.find((route) => route.path === componentName);
  }

  /**
   * This will lazily load a component and return a reference to it.
   *
   * The component to load must be registered in the widgetRoutes array.
   * If the component is not found or it fails to load, it will return
   * the `NotFoundComponent`.
   *
   * @param componentName the name of the component to load
   * @returns a reference to the component class
   */
  async loadWidget(componentName: string | undefined) {
    const route = this.getRoute(componentName);
    if (route && 'loadComponent' in route && typeof route.loadComponent === 'function') {
      try {
        const moduleOrComponent = await route.loadComponent();
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
    return (await import('../../views/widgets/not-found.component')).default;
  }
}
