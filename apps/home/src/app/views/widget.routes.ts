import { Route } from '@angular/router';

/**
 * The widget repository
 *
 * All available widgets are looked up here.
 */
export const widgetRoutes: Route[] = [
  {
    path: 'weather',
    data: { widget: true, tags: ['integration'] },
    loadComponent: () => import('./widgets/weather/weather.component').then((m) => m.default),
  },
  {
    path: 'starfield',
    data: { widget: true, tags: ['graphics'] },
    loadComponent: () => import('./widgets/starfield/starfield.component').then((m) => m.default),
  },
  {
    path: 'pyramid',
    data: { widget: true, tags: ['graphics'] },
    loadComponent: () => import('./widgets/pyramid/pyramid.component').then((m) => m.default),
  },
];
