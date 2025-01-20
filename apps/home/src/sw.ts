import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { setCacheNameDetails } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { googleFontsCache } from 'workbox-recipes';
import { registerRoute, setDefaultHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope | any;
const prefix = 'home';
const version = 'v1';

setDefaultHandler(new NetworkOnly());

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
setCacheNameDetails({
  prefix: prefix,
  suffix: version,
  precache: 'precache',
});
let manifest = self.__WB_MANIFEST;
if (manifest == null || !Array.isArray(manifest)) {
  manifest = [{ url: '/index.html', revision: null }];
}
precacheAndRoute(manifest);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') return false;

    // If this looks like a URL for a resource, because it contains // a file extension, skip.
    if (url.pathname.match(fileExtensionRegexp)) return false;

    // Return true to signal that we want to use the handler.
    return true;
  },
  createHandlerBoundToURL('/index.html'),
);

/**
 * -------------------------------------------------------
 * Define cache strategy and routes here
 * -------------------------------------------------------
 */
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
googleFontsCache({ cachePrefix: `${prefix}-fonts` });

// Cache any external images for 30 days
registerRoute(
  /\.(png|gif|jpg|jpeg|svg|ico)$/,
  new CacheFirst({
    cacheName: `${prefix}-images-${version}`,
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
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: `${prefix}-api-${version}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 1 }),
    ],
  }),
  'GET',
);
/**
 * -------------------------------------------------------
 * End of cache strategy and routes
 * -------------------------------------------------------
 */

// Clean outdated WB caches
// This will compile to run inside an `activate` event handler and therefore
// will only run once per activation of the service worker.
cleanupOutdatedCaches();

// Tell the active service worker to take control of the page immediately.
self.addEventListener('activate', () => self.clients.claim());

// Install app immediately when client is ready
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
