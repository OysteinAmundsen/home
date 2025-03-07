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
    loadComponent: () => import('./widgets/weather/weather.component').then((m) => m.default),
  },
  {
    path: 'starfield',
    data: { widget: true },
    loadComponent: () => import('./widgets/starfield/starfield.component').then((m) => m.default),
  },
  {
    path: 'webgpu',
    data: { widget: true },
    loadComponent: () => import('./widgets/webgpu/webgpu.component').then((m) => m.default),
  },
];
