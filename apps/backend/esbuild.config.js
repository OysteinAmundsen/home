const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Since esbuild does not support glob patterns,
// we need to manually resolve the external widgets
// by reading the directory structure. This is a
// workaround to avoid bundling the widgets.
const widgetsDir = path.resolve(__dirname, '../../libs/widgets');
const widgetFiles = fs.existsSync(widgetsDir) ? fs.readdirSync(widgetsDir) : [];
const externalWidgets = widgetFiles
  .filter((file) => !file.startsWith('widget.routes')) // Exclude `widget.routes`
  .map((file) => `@home/widgets/${file}`);

console.log('Exclude external widgets from bundle:', externalWidgets);

esbuild
  .build({
    entryPoints: ['apps/backend/src/main.ts'], // Adjust the entry point as needed
    bundle: true,
    tsconfig: 'apps/backend/tsconfig.app.json',
    platform: 'node',
    outdir: 'dist/apps/backend',
    external: ['class-transformer', ...externalWidgets],
    sourcemap: !isProduction,
    minify: isProduction,
  })
  .catch(() => process.exit(1));
