import { bootstrapApplication } from '@angular/platform-browser';
import { Workbox } from 'workbox-window';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .then(() => loadServiceWorker())
  .catch((err) => console.error(err));

/**
 * Load service worker
 * This will also listen for updates and act accordingly
 */
async function loadServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const wb = new Workbox('/sw.js', { scope: '/', updateViaCache: 'none' });

      // Log out events in sequence:
      // [installing -> installed -> redundant -> waiting -> activating -> controlling -> activated]
      wb.addEventListener('installing', () => console.log('Installing service worker'));
      wb.addEventListener('installed', () => console.log('Installed!'));
      wb.addEventListener('redundant', () => console.log('Redundant service worker found'));
      wb.addEventListener('waiting', () => {
        console.log('Waiting to activate service worker <- Auto skip');
        wb.messageSkipWaiting();
      });
      wb.addEventListener('activating', () => console.log('Activating service worker'));
      wb.addEventListener('controlling', () => {
        console.log('Service worker controlling page <- Reloading');
        window.location.reload();
      });
      wb.addEventListener('activated', () => console.log('New service worker activated!'));

      // Register the service worker
      const reg = await wb.register({ immediate: true });
      if (!reg) throw 'Service worker not registered!';

      // Check for updates every 5 minutes
      setInterval(() => wb.update(), 1 * 60 * 1000);

      // Setup notification
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const { publicKey } = await fetch('/api/notification/vapid').then((res) => res.json());
        const convertedKey = urlBase64ToUint8Array(publicKey);
        subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedKey });
      }
      fetch('/api/notification/register', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log('Service worker not supported', 'App', true);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
