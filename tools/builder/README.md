# builder

Custom builder for this angular project. This is done so that we can hook up
workbox build on both `nx build home` and `nx serve home`

The builder is created using the following commands:

```bash
nx g @nx/plugin:plugin tools/builder
nx generate @nx/plugin:executor tools/builder/src/executors/application/application
nx generate @nx/plugin:executor tools/builder/src/executors/dev-server/dev-server
```
