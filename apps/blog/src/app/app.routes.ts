import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'articles/:slug',
    loadComponent: () =>
      import('./pages/article-detail/article-detail.component').then((m) => m.ArticleDetailComponent),
  },
  {
    // Only available in development mode
    // This route is protected and only accessible when the app is running on localhost
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [
      () => {
        const platformId = inject(PLATFORM_ID);
        if (isPlatformBrowser(platformId)) {
          return location.origin.includes('://localhost');
        }
        return true;
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
