import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { Workbox } from 'workbox-window';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err))
  .then(() => loadServiceWorker());

/**
 * Load service worker
 * This will also listen for updates and act accordingly
 */
function loadServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const wb = new Workbox('/sw.js', { scope: '/', updateViaCache: 'none' });

      // Log out events in sequence:
      // [installing -> installed -> redundant -> waiting -> activating -> controlling -> activated]
      wb.addEventListener('installing', () =>
        console.log('Installing service worker'),
      );
      wb.addEventListener('installed', () => console.log('Installed!'));
      wb.addEventListener('redundant', () =>
        console.log('Redundant service worker found'),
      );
      wb.addEventListener('waiting', () => {
        console.log('Waiting to activate service worker <- Auto skip');
        wb.messageSkipWaiting();
      });
      wb.addEventListener('activating', () =>
        console.log('Activating service worker'),
      );
      wb.addEventListener('controlling', () => {
        console.log('Service worker controlling page <- Reloading');
        window.location.reload();
      });
      wb.addEventListener('activated', () =>
        console.log('New service worker activated!'),
      );

      // Register the service worker
      wb.register({ immediate: true })
        .then((reg) => {
          if (!reg) throw 'Service worker not registered!';

          // Check for updates every 5 minutes
          setInterval(() => wb.update(), 1 * 60 * 1000);
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log('Service worker not supported', 'App', true);
  }
}
