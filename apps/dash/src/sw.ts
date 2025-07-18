// eslint-disable-next-line @nx/enforce-module-boundaries
import { NotificationContent } from '@home/dash-api/app/subscribe/notification.model';
import { logMsg } from '@home/shared/browser/logger/logger';
import {
  SW_CACHE_PRECACHE,
  SW_CACHE_PREFIX,
  SW_CACHE_VERSION,
} from '@home/shared/browser/service-worker/service-worker';
import { ServiceWorkerMLCEngineHandler } from '@mlc-ai/web-llm';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { setCacheNameDetails } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { googleFontsCache } from 'workbox-recipes';
import { registerRoute, setDefaultHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: ServiceWorkerGlobalScope | any;

// This will create a new `onMessage` handler for the service worker
const llmHandler = new ServiceWorkerMLCEngineHandler();

// Typescript did not understand PushEvent, so we need to declare it
declare type PushEvent = Event & { data: PushMessageData; waitUntil: (f: Promise<unknown>) => void };
// and even though arrayBuffer, blob, bytes and text are in the PushMessageData interface, we only want json
declare type PushMessageData = {
  // arrayBuffer: () => ArrayBuffer;
  // blob: () => Blob;
  // bytes: () => Uint8Array;
  json: () => NotificationContent;
  text: () => string;
};

declare type ExtendableEvent = Event & {
  waitUntil: (f: Promise<unknown>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skipWaiting: () => Promise<any>;
};

setDefaultHandler(new NetworkOnly());

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
setCacheNameDetails({
  prefix: SW_CACHE_PREFIX,
  suffix: SW_CACHE_VERSION,
  precache: SW_CACHE_PRECACHE,
});
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
// When built through nx serve, the index file is named index.html
// When built through nx build, the index file is named index.csr.html
const index = manifest.find((entry: any) => entry.url.includes('index.'));
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') return false;

    // If this looks like a URL for a resource, because it contains // a file extension, skip.
    if (url.pathname.match(fileExtensionRegexp)) return false;

    // If the url starts with /api, skip.
    if (url.pathname.startsWith('/api')) return false;

    // Return true to signal that we want to use the handler.
    return true;
  },
  createHandlerBoundToURL(`/${index?.url ?? 'index.html'}`),
);

// #region Cache and routes
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
googleFontsCache({ cachePrefix: `${SW_CACHE_PREFIX}-fonts` });

// Cache any external images for 30 days
registerRoute(
  /\.(png|gif|jpg|jpeg|svg|ico)$/,
  new CacheFirst({
    cacheName: `${SW_CACHE_PREFIX}-images-${SW_CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

// cache the data request so that, if the network is off we get the last good response
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: `${SW_CACHE_PREFIX}-api-${SW_CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 1 }),
    ],
  }),
  'GET',
);
// #endregion

// #region Activation
// Clean outdated WB caches
// This will compile to run inside an `activate` event handler and therefore
// will only run once per activation of the service worker.
cleanupOutdatedCaches();

self.addEventListener('install', (event: ExtendableEvent) => {
  console.debug(...logMsg('debug', 'SW', 'Installing service worker'));
});

// Tell the active service worker to take control of the page immediately.
self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('message', async (event: MessageEvent) => {
  // Install app when client is ready
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.debug(...logMsg('debug', 'SW', 'Skip waiting message received'));
    self.skipWaiting();
  }
});

// Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) return;

  console.debug(...logMsg('debug', 'SW', 'Notification event received', event.data));
  const notification: NotificationContent = {
    title: 'Home',
    body: 'Message',
    tag: 'home-notification',
    icon: `images/info.png`,
    type: 'info',
  };
  try {
    const json = event.data?.json();
    if (json) {
      Object.assign(notification, json as NotificationContent, {
        icon: `images/${json.type || notification.type}.png`,
      });
    }
  } catch (error) {
    const text = event.data?.text();
    Object.assign(notification, { body: text });
  }
  event.waitUntil(self.registration.showNotification(notification.title || 'Title', notification));
});
