import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withViewTransitions } from '@angular/router';
import { WIDGET_ROUTES_TOKEN } from '@home/shared/widget/widget-routes.token';
import { appRoutes } from './app.routes';
import { widgetRoutes } from './views/widget.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withIncrementalHydration(), withEventReplay()),
    provideRouter(appRoutes, withViewTransitions() /*withDebugTracing()*/),
    provideExperimentalZonelessChangeDetection(),
    // provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    { provide: WIDGET_ROUTES_TOKEN, useValue: widgetRoutes },
  ],
};
