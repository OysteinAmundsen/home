import { Route } from '@angular/router';

/**
 * The widget repository
 *
 * All available widgets are looked up here.
 */
export const widgetRoutes: Route[] = [
  {
    path: 'weather',
    data: { widget: true },
    loadComponent: () => import('./widgets/weather.component').then((m) => m.default),
  },
  {
    path: 'starfield',
    data: { widget: true },
    loadComponent: () => import('./widgets/starfield.component').then((m) => m.default),
  },
];
