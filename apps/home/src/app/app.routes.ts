import { Route } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { widgetRoutes } from './views/widget.routes';

export const appRoutes: Route[] = [{ path: '', component: DashboardComponent }, ...widgetRoutes];
