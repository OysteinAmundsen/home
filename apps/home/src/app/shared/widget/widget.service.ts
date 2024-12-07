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
    loader: async ({ request, abortSignal }) => {
      // Cannot use fetch directly because Angular's SSR does not support it.
      // I get a `TypeError: Failed to parse URL` from SSR when using fetch.
      return await firstValueFrom(
        this.http.get<Widget[]>(
          `/api/widgets${request.id ? '/' + request.id : ''}`,
        ),
      );
    },
  });
}
