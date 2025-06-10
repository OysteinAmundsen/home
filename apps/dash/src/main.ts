import { bootstrapApplication } from '@angular/platform-browser';
import { logMsg } from '@home/shared/browser/logger/logger';
import { loadServiceWorker } from '@home/shared/browser/service-worker/service-worker';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

loadServiceWorker()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((err) => console.error(...logMsg('error', '', err)));
