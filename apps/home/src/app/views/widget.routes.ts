import { Route } from '@angular/router';

/**
 * The widget repository
 *
 * All available widgets are looked up here.
 */
export const widgetRoutes: Route[] = [
  {
    path: 'weather',
    loadChildren: () => import('./weather.component').then((m) => m.default),
  },
  {
    path: 'starfield',
    loadChildren: () => import('./starfield.component').then((m) => m.default),
  },
  {
    path: 'not-found',
    loadChildren: () => import('./not-found.component').then((m) => m.default),
  },
];
