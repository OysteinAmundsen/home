Contains services for accessing browser api's.

- [`ConnectivityService`](./connectivity/connectivity.service.ts) - detects if we are online or offline and reports back in a stream
- [`GeoLocationService`](./geo-location/geo-location.service.ts) - monitors the geolocation browser api and reports the current GeoLocation of the device. This requires user permission.
- [`StorageService`](./storage/storage.service.ts) - An abstraction for localStorage which can handle complex json structures instead of just string values.
- [`ThemeService`](./theme/theme.service.ts) - monitors the current color scheme, which is set by default from the system OS but can also be overridden manually by the user. This allows UX to toggle light/dark mode but also allow system to auto-set preference.
- [`VisibilityService`](./visibility/visibility.service.ts) - monitors if the browser is in focus and active or not
- [`NotificationService`](./notification/notification.service.ts) - Helper which allows users to subscribe or unsubscribe to push notifications. This requires a service worker to be present

Also contains a [directive wrapping the `ResizeObservable` api](./resize/resize.directive.ts) for an element. This can be used to report back what the elements intrinsic size is over time.
