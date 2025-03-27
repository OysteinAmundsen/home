# Home

Dashboard app testing Angular 19 features using custom API from SSR server and lazy-loaded and lazy-rendered components.

The app features:

- [BFF - NestJS powered api](#backend-for-frontend)
- [Workbox service-worker built into the dev process](#service-worker).
- [Widget dashboard](#dashboard-system) system where each widget is a [self enclosed library](./libs/widgets/) with a dashboard view and a fullscreen view.
- Integrations to third parties like met.no for weather data and nordnet.no for financial instrument data.
- Experimentation with canvas and webGPU
- Experimentation with local AI models
- [Experimentation with browser api's and best practices on permission handling](#utilities)

This is my feature playground. Nothing useful here, just me playing around.

![NX Graph](./docs/nx-graph.png)
![Screenshot](./apps/frontend/public/screenshots/dashboard.png)

## How to build and use

This project is built using [`bun`](https://bun.sh/).

```bash
bun install
bun start
```

This will install dependencies and spin up the dev-server.

### Use npm instead

I have heard that some people might have had difficulties in installing dependencies and getting this to run using `npm`. If you do not want to use `bun` for some reason, you might get this to run by

```bash
rm -rf bun.lock
npm install --force
sed -i.bak -e 's/bun x/npx/g' -e 's/bun /npm /g' package.json
```

This will remove the bun lockfile, install dependencies using npm and lastly replace all usage of `bun` in `package.json` with the `npm` equivalent.

### Prerequisites (Windows)

One of the widgets here use a transcription AI translating audio to text. In order to use this, you will need to install some prerequisites:

```cmd
winget install --id Python.Python.3.11
python -m pip install --upgrade pip
pip install faster-whisper
python -c "from faster_whisper import WhisperModel; WhisperModel('NbAiLab/nb-whisper-small', device='cpu', compute_type='int8')"
```

This installs python and loads up the whisper ai model. After this, `bun start` will be able to handle audio inputs from the client and transcribe it. Currently only transcribing in norwegian, and it will try to translate any audio.

## Backend for frontend

Angular now allows the use of a express http server for its server side rendering. By utilizing this, we can extend the capabilities here by also introducing a backend framework like NestJS. This is how I do it:

In [server.ts](./apps/frontend/server.ts) I first setup a NestExpressApplication

```typescript
const app = await NestFactory.create<NestExpressApplication>(ApiModule);
```

This creates the nest application with my [main module](./apps/backend/src/api/api.module.ts).

I then get the express instance:

```typescript
const server = app.getHttpAdapter().getInstance();
```

which the `AngularNodeAppEngine` requires for server-side rendering.

```typescript
const angularNodeAppEngine = new AngularNodeAppEngine();
server.use('*splat', (req, res, next) => {
  angularNodeAppEngine
    .handle(req, {
      server: 'express',
      request: req,
      response: res,
      cookies: req.headers.cookie,
    })
    .then((response) => {
      // If the Angular app returned a response, write it to the Express response
      if (response) {
        return writeResponseToNodeResponse(response, res);
      }
      // If not, this is not an Angular route, so continue to the next middleware
      return next();
    })
    .catch(next);
});
```

Then lastly, after I'm done configuring express with anything that cannot or should not be done in Nest, I initialize my NestJS application

```typescript
app.init();
```

Angular SSR process is here used as an express middleware, which NestJS has support for. So I could probably move the entire rendering process inside a `NestMiddleware`.

## Service-worker

This app is a PWA. Which means that it needs a [web manifest](./apps/frontend/public/manifest.webmanifest) and a [javascript file](./apps/frontend/src/sw.ts) which is loaded and registered on startup.

One of the main things a service-worker does, is it instructs the browser to pre-load and cache all the static resources of your app - like javascript, css and other files (the most important being your `index.html`).

Angular has its built in [ngsw](https://angular.dev/ecosystem/service-workers/config), which generates a generic service-worker build time. This is fine in simple cases, but if you want to have more control, you will want to roll your own. Google has [WorkBox](https://developer.chrome.com/docs/workbox), a "framework" for building service-workers which is excellent.

When angular builds using ngsw, it knows about all the artifacts it builds and can give these to their sw generator to properly pre-cache the app - and it does so on both build and serve. But
angular does not expose anything yet which can hook into the proper place in the build process to retrieve all artifacts.

This is no problem when running a production build (`nx build`). All you have to do then is to loop through the files in the `dist` folder of your app to build this list, but when you want to `ng serve` your app locally - _like you often do when you are developing_ - the dist folder is not present because angular now builds and serves the files in memory.

This repo tries to solve this by using 2 things to do build the service-worker pre-cache:

- [A custom esbuild plugin](./apps/frontend/builders/custom-esbuild.ts) which runs on `nx serve` and tries to hook into esbuild's `onEnd` hook. But angular uses both esbuild and vite to build, and esbuild only bundles the javascript. So I get the bundles here, but nothing else. I try to loop through what is known and generate a pre-cache regardless, but I cannot get the generated css here.
- [A custom webpack plugin](./apps/frontend/builders/webpack.config.js) which runs on `nx build` and properly creates the precache based on files actually outputted to disk.

The first is given to esbuild by using the [nx application executor](./apps/frontend/project.json) for our builds:

```json
  "targets": {
    "build": {
      "executor": "@nx/angular:application",
      "options": {
        "plugins": ["apps/frontend/builders/custom-esbuild.ts"],
```

Which actually means that it runs both on build and on serve, but for `nx build` I overwrite the results with the proper pre-cache. This is done using a separate script:

```bash
nx build
bun x webpack --config ./apps/frontend/builders/webpack.config.js
```

So angular builds first, then I run the `workbox-build.injectManifest` after.

The most important thing here, is that I have an active and working service-worker on both build and serve, which allows me to test out service-worker specific code without having to prod build every single time.

## Dashboard system

I wanted to make a dashboard of mini-applications. Each mini-application (widget) should be lazily loaded. For individual routes, this is easy using angular and the `loadChildren` route config. But when the widgets should be displayed in a single view, like a dashboard, it becomes a bit more tricky.

We have a [dashboard view](./apps/frontend/src/app/views/dashboard/) and we use a [widget-loader](./libs/shared/src/lib/widget/widget-loader.component.ts) to load in our widgets at runtime. So widgets are only loaded when something in the dashboard instructs the widget loader to do so. This means that you can create an endless portfolio of widgets, but they take up no space on the client before the client is instructed to show them.

Our [widget service](./libs/shared/src/lib/widget/widget.service.ts) uses the [widget-routes](./libs/widgets/widget.routes.ts) as a repository of which widget names are available and how to load them. The dashboard view asks the backend for a dashboard configuration, which is basically an array of widget names to display. When this is received, the dashboard view creates one widget-loader per widget name, and the loader takes care of loading the code, creating the component dynamically and render it in the dashboard viewport. And since the widget repository is also a route configuration, we can use this to create routes to show our widgets in fullscreen.

This opens up for the possibility to have several different dashboard configurations depending on your need. We could for instance have a dashboard driven application where we have multiple levels of information and each level required different kinds of widgets.

## Utilities

This repo contains several generic utilities which are great for reuse:

- [Browser api helpers](./libs/shared/src/lib/browser/)
- [rxjs](./libs/shared/src/lib/rxjs/)
- [Other utilities](./libs/shared/src/lib/utils/)
