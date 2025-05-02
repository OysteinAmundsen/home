import { clear } from 'console';
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

/**
 * Will return true when the service worker is activated and controlling the page.
 * By default, If the service worker is not activated, it will unregister the service worker
 * and reload the page. You can set the timeout to 0 to disable this behavior.
 *
 * @param timeoutMs optional timeout in milliseconds to wait for the service worker to be activated
 *                  before unregistering and reloading the page. Default is 10 seconds.
 *                  Set to 0 to disable timeout.
 * @returns true when the service worker is activated and controlling the page, false otherwise.
 */
export async function serviceWorkerActivated(timeoutMs = 10000): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    return await new Promise<boolean>((resolve, reject) => {
      let timeout: NodeJS.Timeout | null = null;
      if (timeoutMs > 0) {
        timeout = setTimeout(async () => {
          console.warn('Service worker activation timed out. Unregistering and reloading...');
          await registration.unregister();
          reject(new Error('Service worker activation timed out.'));
          window.location.reload();
        }, timeoutMs);
      }

      const checkIfActiveAndControlling = () => {
        const serviceWorker = navigator.serviceWorker.controller;
        if (registration.active?.state === 'activated' && serviceWorker) {
          if (timeout) clearTimeout(timeout);
          registration.active?.removeEventListener('statechange', checkIfActiveAndControlling);
          navigator.serviceWorker.removeEventListener('controllerchange', checkIfActiveAndControlling);
          resolve(true);
        }
      };

      // Listen for state changes on the active service worker
      registration.active?.addEventListener('statechange', checkIfActiveAndControlling);

      // Listen for controller changes on the navigator
      navigator.serviceWorker.addEventListener('controllerchange', checkIfActiveAndControlling);

      // Check immediately in case it's already activated and controlling
      checkIfActiveAndControlling();
    });
  }
  return false;
}
