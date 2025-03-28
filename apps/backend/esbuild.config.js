const esbuild = require('esbuild');

const isProduction = process.env.NODE_ENV === 'production';

esbuild
  .build({
    entryPoints: ['apps/backend/src/main.ts'], // Adjust the entry point as needed
    bundle: true,
    platform: 'node',
    outdir: 'dist/apps/backend',
    external: ['node_modules/*', 'class-transformer/storage'],
    sourcemap: !isProduction,
    minify: isProduction,
  })
  .catch(() => process.exit(1));
