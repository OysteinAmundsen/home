import { bootstrapApplication } from '@angular/platform-browser';
import { loadServiceWorker } from '@home/shared/browser/service-worker/service-worker';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

loadServiceWorker()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((err) => console.error(err));
