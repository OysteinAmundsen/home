import { Route } from '@angular/router';
import { widgetRoutes } from '@home/widgets/widget.routes';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { TestComponent } from './views/test/test.component';

export const appRoutes: Route[] = [
  { path: '', component: DashboardComponent },
  { path: 'test', component: TestComponent },
  ...widgetRoutes,
];
