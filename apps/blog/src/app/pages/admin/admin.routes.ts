import { Route } from '@angular/router';

export const adminRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'articles',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./articles/article-list/article-list.component').then((m) => m.ArticleListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./articles/article-editor/article-editor.component').then((m) => m.ArticleEditorComponent),
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./articles/article-editor/article-editor.component').then((m) => m.ArticleEditorComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
