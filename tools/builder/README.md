# builder

This was a test to see if I could build the service-worker with a proper pre-cache of all outputted build artifacts into the angular build process. It was supposed to replace the nx application executor with this instead:

```json
  "targets": {
    "build": {
      "executor": "@home/builder:application",
```

but unfortunately this did not prove any more useful than having a [custom esbuild plugin](../../apps/frontend/builders/custom-esbuild.ts) instead. The same amount of artifacts are available at the point I have access to inject code anyway, so this code is only here for historic purposes.
