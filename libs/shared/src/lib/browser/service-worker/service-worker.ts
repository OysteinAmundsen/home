import { Workbox } from 'workbox-window';

export const SERVICE_WORKER = '/sw.js';

/**
 * Load service worker
 * This will also listen for updates and act accordingly
 */
export async function loadServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      console.debug('Registering service worker...');
      const wb = new Workbox(SERVICE_WORKER, { scope: '/', updateViaCache: 'none' });

      // Log out events in sequence:
      // [installing -> installed -> redundant -> waiting -> activating -> controlling -> activated]
      wb.addEventListener('installing', () => console.debug('Installing service worker'));
      wb.addEventListener('installed', (event) => {
        console.debug('Installed!');
        if (event.isUpdate) {
          console.debug('New service worker waiting to activate');
        }
      });
      wb.addEventListener('redundant', () => console.debug('Redundant service worker found'));
      wb.addEventListener('waiting', () => {
        console.debug('Waiting to activate service worker <- Auto skip');
        wb.messageSkipWaiting();
      });
      wb.addEventListener('activating', () => console.debug('Activating service worker'));
      wb.addEventListener('controlling', () => {
        console.debug('Service worker controlling page');
        // Avoid redundant reloads if already controlled
        // if (!navigator.serviceWorker.controller) {
        // console.debug('Reloading page to apply new service worker');
        window.location.reload();
        // }
      });
      wb.addEventListener('activated', () => {
        console.debug('New service worker activated!');
        // Notify the service worker to hot-swap pre-cached content
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'HOT_SWAP' });
        }
      });

      // Register the service worker
      const reg = await wb.register({ immediate: true });
      if (!reg) throw 'Service worker not registered!';

      // Check for updates every 10 minutes
      await wb.update();
      setInterval(async () => await wb.update(), 10 * 60 * 1000);
    } catch (err) {
      console.error('WS registration failed: ', err);
    }
  } else {
    console.debug('Service worker not supported', 'App', true);
  }
}

/**
 * Unregister all service workers
 * This is useful for debugging and development purposes
 */
export async function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      console.debug('Unregistering service worker', registration);
      await registration.unregister();
    }
  } else {
    console.debug('Service worker not supported', 'App', true);
  }
}

export async function emptyCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      console.debug('Deleting cache', cacheName);
      await caches.delete(cacheName);
    }
  } else {
    console.debug('Cache not supported', 'App', true);
  }
}

/**
 * Will return true when the service worker is activated and controlling the page.
 * By default, If the service worker is not activated, it will unregister the service worker
 * and reload the page. You can set the timeout to 0 to disable this behavior.
 *
 * @param timeoutMs optional timeout in milliseconds to wait for the service worker to be activated
 *                  before failing. Default is 10 seconds. Set to 0 to disable timeout.
 * @returns true when the service worker is activated and controlling the page, false otherwise.
 */
export async function serviceWorkerActivated(timeoutMs = 5000, reloadOnTimeout = true): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    return await new Promise<boolean>((resolve) => {
      let timeout: NodeJS.Timeout | null = null;
      if (timeoutMs > 0) {
        timeout = setTimeout(async () => {
          console.warn('Service worker activation timed out');
          if (reloadOnTimeout) {
            console.debug('Unregistering service worker and reloading page...');
            await unregisterServiceWorkers();
            // Delete the precache cache to force a reload of the app shell
            await caches.delete('home-precache-v1');
            // Reload the page to apply changes
            window.location.reload();
          }
          resolve(false);
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
