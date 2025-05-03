import { Route } from '@angular/router';
import { widgetRoutes } from '@home/widgets/widget.routes';
import { DashboardComponent } from './views/dashboard/dashboard.component';

export const appRoutes: Route[] = [{ path: '', component: DashboardComponent }, ...widgetRoutes];
