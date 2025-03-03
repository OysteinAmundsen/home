import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'weather', renderMode: RenderMode.Client },
  { path: 'starfield', renderMode: RenderMode.Client },
  { path: 'not-found', renderMode: RenderMode.Client },
];
