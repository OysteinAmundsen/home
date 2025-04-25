import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isProduction = process.env.NODE_ENV === 'production';
try {
  // This is required for ESM support when running backend through SSR
  globalThis.__filename = fileURLToPath(import.meta.url); // Resolve current file path for ESM
  globalThis.__dirname = path.dirname(globalThis.__filename); // Resolve directory path for ESM
} catch (error) {
  // This happens when running pure backend
}

// Since esbuild does not support glob patterns,
// we need to manually resolve the external widgets
// by reading the directory structure. This is a
// workaround to avoid bundling the widgets.
const widgetsDir = path.resolve(__dirname, '../../libs/widgets');
const widgetFiles = fs.existsSync(widgetsDir) ? fs.readdirSync(widgetsDir) : [];
const externalWidgets = widgetFiles
  .filter((file) => !file.startsWith('widget.routes')) // Exclude `widget.routes`
  .map((file) => `@home/widgets/${file}`);

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
    plugins: [
      copy({
        assets: {
          from: [
            './node_modules/swagger-ui-dist/**/{swagger-ui.css,swagger-ui-bundle.js,swagger-ui-standalone-preset.js,favicon-32x32.png,favicon-16x16.png}',
          ],
          to: ['./api/api'],
        },
      }),
    ],
  })
  .then(() => {
    console.log('Exclude external widgets from bundle:', externalWidgets);
  })
  .catch(() => process.exit(1));
