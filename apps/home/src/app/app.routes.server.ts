import { RenderMode, ServerRoute } from '@angular/ssr';
import { widgetRoutes } from './views/widget.routes';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  ...widgetRoutes.map((route) => ({ path: `${route.path}`, renderMode: RenderMode.Server }) as ServerRoute),
];
