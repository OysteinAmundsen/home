import { InjectionToken } from '@angular/core';
import { Route } from '@angular/router';

export const WIDGET_ROUTES_TOKEN = new InjectionToken<Route[]>('WIDGET_ROUTES_TOKEN');
