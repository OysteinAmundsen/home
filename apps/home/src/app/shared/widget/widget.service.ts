import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Widget = {
  id: number;
  name: string;
  componentName: string;
};

@Injectable({ providedIn: 'root' })
export class WidgetService {
  private http = inject(HttpClient);

  filter = signal<number | undefined>(undefined);
  widgets = resource({
    request: () => ({ id: this.filter() }),
    loader: async ({ request }) => {
      // Cannot use fetch directly because Angular's SSR does not support it.
      // I get a `TypeError: Failed to parse URL` from SSR when using fetch.
      return await firstValueFrom(
        this.http.get<Widget[]>(
          `/api/widgets${request.id ? '/' + request.id : ''}`,
        ),
      );
    },
  });

  /**
   * This acts as a repository for the widgets.
   * Its main function is to load the component based on the componentName.
   *
   * @param componentName
   * @returns
   */
  async loadWidget(componentName: string | undefined) {
    let component: any;
    switch (componentName) {
      case 'widget1':
        component = (await import('../../views/widget1.component'))
          .Widget1Component;
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
