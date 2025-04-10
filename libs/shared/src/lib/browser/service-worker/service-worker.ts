import { Workbox } from 'workbox-window';

export const SERVICE_WORKER = '/sw.js';

/**
 * Load service worker
 * This will also listen for updates and act accordingly
 */
export async function loadServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const wb = new Workbox(SERVICE_WORKER, { scope: '/', updateViaCache: 'none' });

      // Log out events in sequence:
      // [installing -> installed -> redundant -> waiting -> activating -> controlling -> activated]
      wb.addEventListener('installing', () => console.log('Installing service worker'));
      wb.addEventListener('installed', (event) => {
        console.log('Installed!');
        if (event.isUpdate) {
          console.log('New service worker waiting to activate');
        }
      });
      wb.addEventListener('redundant', () => console.log('Redundant service worker found'));
      wb.addEventListener('waiting', () => {
        console.log('Waiting to activate service worker <- Auto skip');
        wb.messageSkipWaiting();
      });
      wb.addEventListener('activating', () => console.log('Activating service worker'));
      wb.addEventListener('controlling', () => {
        console.log('Service worker controlling page');
        // Avoid redundant reloads if already controlled
        if (!navigator.serviceWorker.controller) {
          console.log('Reloading page to apply new service worker');
          window.location.reload();
        }
      });
      wb.addEventListener('activated', () => {
        console.log('New service worker activated!');
        // Notify the service worker to hot-swap pre-cached content
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'HOT_SWAP' });
        }
      });

      // Register the service worker
      const reg = await wb.register({ immediate: true });
      if (!reg) throw 'Service worker not registered!';

      // Check for updates every 10 minutes
      setInterval(() => wb.update(), 10 * 60 * 1000);
    } catch (err) {
      console.log('WS registration failed: ', err);
    }
  } else {
    console.log('Service worker not supported', 'App', true);
  }
}
