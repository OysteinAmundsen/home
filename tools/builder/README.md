# builder

Custom builder for this angular project. This is done so that we can hook up workbox build on both nx build home and nx serve home

The builder is created using the following commands:

```
nx g @nx/plugin:plugin "--directory=tools/builder" "--name=builder" --no-interactive
nx g @nx/plugin:executor "--path=tools/builder/src/application/index" "--description=Application" "--name=application" --no-interactive
nx g @nx/plugin:executor "--path=tools/builder/src/dev-server/index" "--description=dev-server" "--name=dev-server" --no-interactive
```
