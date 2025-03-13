import { Route } from '@angular/router';

/**
 * The widget repository
 *
 * All available widgets are looked up here.
 */
export const widgetRoutes: Route[] = [
  {
    path: 'weather',
    data: { widget: true, tags: ['integrations'] },
    loadComponent: () => import('@home/widgets/weather').then((m) => m.default),
  },
  {
    path: 'starfield',
    data: { widget: true, tags: ['graphics'] },
    loadComponent: () => import('@home/widgets/starfield').then((m) => m.default),
  },
  {
    path: 'pyramid',
    data: { widget: true, tags: ['graphics'] },
    loadComponent: () => import('@home/widgets/pyramid').then((m) => m.default),
  },
];
