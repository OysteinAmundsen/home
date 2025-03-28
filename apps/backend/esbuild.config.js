const esbuild = require('esbuild');

const isProduction = process.env.NODE_ENV === 'production';

esbuild
  .build({
    entryPoints: ['apps/backend/src/main.ts'], // Adjust the entry point as needed
    bundle: true,
    platform: 'node',
    outdir: 'dist/apps/backend',
    external: [
      'node_modules/*',
      'class-transformer',
      // I wish I could say here that everything under `@home/widgets/*`
      // should be external, EXCEPT `@home/widgets/widget.routes`. Like:
      // ```
      // '@home/widgets/*',
      // '!@home/widgets/widget.routes',
      // ```
      // but esbuild doesn't seem to support that yet.
      '@home/widgets/fund',
      '@home/widgets/pyramid',
      '@home/widgets/starfield',
      '@home/widgets/transcribe',
      '@home/widgets/weather',
    ],
    sourcemap: !isProduction,
    minify: isProduction,
  })
  .catch(() => process.exit(1));
