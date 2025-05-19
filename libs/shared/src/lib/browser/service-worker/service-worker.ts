import { Workbox } from 'workbox-window';
import { logMsg } from '../logger/logger';

export const SERVICE_WORKER = '/sw.js';
export const SW_CACHE_PREFIX = 'home';
export const SW_CACHE_VERSION = 'v1';
export const SW_CACHE_PRECACHE = 'precache';
const precacheName = `${SW_CACHE_PREFIX}-${SW_CACHE_PRECACHE}-${SW_CACHE_VERSION}`;

/**
 * Load service worker
 * This will also listen for updates and act accordingly
 *
 * The following events are triggered in sequence:
 *  -> installing
 *  -> installed
 *  -> redundant
 *  -> waiting
 *  -> activating
 *  -> controlling
 *  -> activated
 */
export async function loadServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      console.debug(...logMsg('debug', 'SW', 'Registering service worker...'));
      const wb = new Workbox(SERVICE_WORKER, { scope: '/', updateViaCache: 'none' });
      await updateServiceWorker(wb); // Check for updates immediately

      // New worker is being installed.
      wb.addEventListener('installing', () => {
        console.debug(...logMsg('debug', 'SW', 'Installing service worker'));
      });
      // New worker finished installing. If there’s an existing active worker, the new one enters waiting.
      wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.debug(...logMsg('debug', 'SW', 'Update waiting to activate'));
        } else {
          console.debug(...logMsg('debug', 'SW', 'Installed!'));
        }
      });
      // New worker is waiting to activate (because the old one is still controlling the page).
      wb.addEventListener('waiting', () => {
        console.debug(...logMsg('debug', 'SW', 'Waiting to activate service worker <- Auto skip'));
        // Message the service worker to skip waiting and activate immediately
        wb.messageSkipWaiting();
      });
      // New worker is activating.
      wb.addEventListener('activating', () => {
        console.debug(...logMsg('debug', 'SW', 'Activating service worker'));
      });
      // New worker is activated and controlling the page
      wb.addEventListener('controlling', () => {
        console.debug(...logMsg('debug', 'SW', 'New service worker is controlling page'));
      });
      // New worker is activated but may not be controlling the page
      wb.addEventListener('activated', async () => {
        console.debug(...logMsg('debug', 'SW', 'New service worker activated! <- Reloading page'));
        window.location.reload(); // Force reload the page to apply changes
      });

      // Register the service worker
      const reg = await wb.register({ immediate: true });
      if (!reg) throw 'SW: Service worker not registered!';
      reg.update(); // Check for updates immediately

      reg.addEventListener('updatefound', async () => {
        console.debug(...logMsg('debug', 'SW', 'Update found!'));
        await emptyCache([precacheName]); // Delete the precache cache to force a reload of the app shell
      });

      // Check for updates every 10 minutes
      setInterval(async () => await updateServiceWorker(wb), 1 * 60 * 1000);
    } catch (err) {
      console.error(...logMsg('error', 'SW', 'Registration failed: ', err));
    }
  } else {
    console.debug(...logMsg('debug', 'SW', 'Service worker not supported', 'App', true));
  }
}

async function updateServiceWorker(wb: Workbox) {
  try {
    await wb.update();
  } catch (err) {
    if (err instanceof Error && err.name === 'InvalidStateError') {
      unregisterServiceWorkers();
    } else {
      console.error(...logMsg('error', 'SW', 'Failed to update service worker: ', err));
    }
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
      console.debug(...logMsg('debug', 'SW', 'Unregistering service worker', registration));
      await registration.unregister();
    }
  } else {
    console.debug(...logMsg('debug', 'SW', 'Service worker not supported', 'App', true));
  }
}

export async function emptyCache(cacheNames?: string[]) {
  if ('caches' in window) {
    cacheNames = cacheNames || (await caches.keys());
    for (const cacheName of cacheNames) {
      console.debug(...logMsg('debug', 'SW', 'Deleting cache', cacheName));
      await caches.delete(cacheName);
    }
  } else {
    console.debug(...logMsg('debug', 'SW', 'Cache not supported', 'App', true));
  }
}

export async function getServiceWorkerRegistration() {
  if ('serviceWorker' in navigator) {
    await serviceWorkerActivated(100, false);
    return await navigator.serviceWorker.getRegistration(SERVICE_WORKER);
  }
  return undefined;
}

/**
 * Will return true when the service worker is activated and controlling the page.
 *
 * By default, If the service worker is not activated, it will unregister the service worker
 * and reload the page. You can set the timeout to 0 to disable this behavior.
 *
 * @param timeoutMs optional timeout in milliseconds to wait for the service worker to be activated
 *                  before failing. Default is 10 seconds. Set to 0 to disable timeout.
 * @returns true when the service worker is activated and controlling the page, false otherwise.
 */
export async function serviceWorkerActivated(timeoutMs = 1000, reloadOnTimeout = true): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    // On browsers using default profile, the service worker will error on loading the precache
    // and will never activate.
    // Error is `InvalidAccessError: Failed to execute 'put' on 'Cache': Entry already exists.`
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), timeoutMs)),
    ]);
    if (!registration) {
      console.warn(...logMsg('warn', 'SW', 'Service worker not ready'));
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      let timeout: NodeJS.Timeout | null = null;
      if (timeoutMs > 0) {
        timeout = setTimeout(async () => {
          console.warn(...logMsg('warn', 'SW', 'Service worker activation timed out'));
          if (reloadOnTimeout) {
            console.debug(...logMsg('debug', 'SW', 'Reloading page...'));
            // Delete the precache cache to force a reload of the app shell
            await emptyCache([precacheName]);
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
          resolve(true);
        }
      };

      // Listen for state changes on the active service worker
      registration.active?.addEventListener('statechange', checkIfActiveAndControlling);

      // Check immediately in case it's already activated and controlling
      checkIfActiveAndControlling();
    });
  }
  return false;
}
