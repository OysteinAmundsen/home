import { bootstrapApplication } from '@angular/platform-browser';
import { loadServiceWorker } from '@home/shared/browser/service-worker/service-worker';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .then(() => loadServiceWorker())
  .catch((err) => console.error(err));
