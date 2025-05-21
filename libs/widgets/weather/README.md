# weather

The first widget made. This integrates with the national weather institute in Norway and displays the local weather forcast. It uses the browsers [GeoLocation api](../../shared/src/lib/browser/geo-location/geo-location.service.ts) to monitor the devices current location. This location object has a resolution accuracy of +/- 10cm, which is a bit overkill for a weather forcast. So I truncate it to nearest 100m so that I do not overload with service requests.

As a fallback, it allows users to search for a location. This uses [Googles GeoLocation api](https://console.cloud.google.com/apis/library/geolocation.googleapis.com) and requires an API key from them to work. I will not provide mine, so you will have to get one your self to see this in action.
