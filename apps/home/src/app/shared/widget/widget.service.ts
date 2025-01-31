import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Widget = {
  id: number;
  name: string;
  componentName: string;
};

@Injectable({ providedIn: 'root' })
export class WidgetService {
  private http = inject(HttpClient);

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
      const widgets = await firstValueFrom(
        this.http.get<Widget[]>(
          `/api/widgets${request.id ? '/' + request.id : ''}`,
        ),
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
   * Its main function is to load the component based on the componentName.
   *
   * @param componentName
   * @returns
   */
  async loadWidget(componentName: string | undefined) {
    let component: any;
    // TODO: Find a better way of handling this. Maybe use a Route[]?
    switch (componentName) {
      case 'weather':
        component = (await import('../../views/weather.component'))
          .WeatherComponent;
        break;
      case 'widget2':
        component = (await import('../../views/widget2.component'))
          .Widget2Component;
        break;
      default:
        component = (await import('../../views/not-found.component'))
          .NotFoundComponent;
        break;
    }
    return component;
  }
}
