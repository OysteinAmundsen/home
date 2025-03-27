import { build, Plugin, PluginBuild } from 'esbuild';
import { readdir, readFileSync } from 'fs';
import * as path from 'path';

export type Manifest = ManifestEntry[];

export interface ManifestEntry {
  url: string;
  revision: string;
}

const MATCH_FILES = /^.+\.(js|css|svg|img|html|txt|webmanifest)$/i;
const manifest: Map<string, ManifestEntry> = new Map();
const appRoot = 'apps/frontend';
const CACHE_BUST = /-[A-Z0-9]{8}\./;

/**
 * This plugin pre-builds the worker and injects the manifest into the service worker
 *
 * ... but it doesn't properly work with Angular's build system.
 * The output files provided by Angular are only the javascript bundles, not
 * any other assets like html, css, etc. So the manifest will be incomplete.
 *
 * I've tried different techniques to get the complete manifest:
 * - **Using a custom esbuild plugin**
 *   to hook into the end of the build process - this is the one you see here
 *   NOTE: This actually works a whole lot better when running `ng serve` than
 *   when running `ng build`. The result.outputFiles array is populated with
 *   a lot more of the files to be included in the manifest. I actually get
 *   css files here as well. But I do have to add index.html manually though.
 *
 * - **Creating my own custom Angular builder**
 *   in order to hook into the absolute end of the process. This worked the same
 *   as the esbuild plugin. Could not get it to compile the complete manifest.
 *
 * The only way I could get this to work, was to use the "recommended" approach,
 * which is to use the workbox-webpack-plugin. This is such a dissapointment.
 */
const wbInject: Plugin = {
  name: 'wbInject',
  setup(builder: PluginBuild) {
    // Append sw to entry points
    // This is done so that it is discoverable in the onEnd hook
    const options = builder.initialOptions;
    Object.assign(options.entryPoints || {}, {
      sw: path.resolve(`${appRoot}/src`, 'sw.ts'),
    });
    let workerCode = '';

    // Pre-build the worker, so that we get a single module for this
    // as angular would chunk it otherwise
    builder.onStart(async () => {
      manifest.clear();
      const result = await build({
        entryPoints: [`${appRoot}/src/sw.ts`],
        bundle: true,
        write: false,
        minify: true,
        platform: 'browser',
        target: 'es2017',
      });
      workerCode = result.outputFiles[0].text;
    });

    // Inject manifest into worker
    builder.onEnd(async (result) => {
      if (result.errors.length !== 0) return;

      // Add build output to manifest
      const files = result.outputFiles?.filter((f) => f.path.match(MATCH_FILES) && !f.path.match(/sw/)) || [];
      for (const file of files) await addToManifest(file.path, file.contents);

      // Add directory contents from `public` folder to manifest
      const filePattern = /\.(ico|webmanifest|png|jpg)$/i;

      // Recursive function to traverse directories
      // I would not need this if I could hook into the end of the build process in Angular
      const readDirRecursive = async (dir: string) => {
        const entries = await new Promise<void>((resolve, reject) =>
          readdir(dir, { withFileTypes: true }, async (err, files) => {
            if (err) return reject(err);

            for (const file of files) {
              const fullPath = path.join(dir, file.name);

              if (file.isDirectory() && !file.name.startsWith('.')) {
                // Recursively process subdirectories
                await readDirRecursive(fullPath);
              } else if (file.isFile() && file.name.match(filePattern)) {
                // Process files matching the pattern
                await addToManifest(fullPath);
              }
            }
            resolve();
          }),
        );
      };

      // Start reading from the root directory
      await readDirRecursive(path.join(appRoot, 'public'));

      // Add index.html to manifest if it doesn't exist
      if (!manifest.has('index.html')) {
        await addToManifest(path.join(appRoot, 'src', 'index.html'));
      }

      const workerFile = result.outputFiles?.find((file) => file.path.match(/sw.*\.js$/));
      const workerSourceMap = result.outputFiles?.find((file) => file.path.match(/sw.*\.js.map$/));
      if (!workerFile) return;

      // Remove cache busting from worker file
      [workerFile, ...(workerSourceMap != null ? [workerSourceMap] : [])].forEach(
        (file) => (file.path = file.path.replace(CACHE_BUST, '.')),
      );

      // Inject manifest into worker
      const man = Array.from(manifest.values()) as Manifest;
      const updatedWorkerCode = workerCode.replace('self.__WB_MANIFEST', JSON.stringify(man));
      console.log('Injected manifest: ', man);

      // Update the worker file in the output
      workerFile.contents = new TextEncoder().encode(updatedWorkerCode);
    });
  },
};

async function addToManifest(filePath: string, contents?: Uint8Array) {
  let relPath = path.relative(`${process.cwd()}`, filePath);

  if (filePath.includes('public')) {
    relPath = path.relative(`${process.cwd()}/${appRoot}/public`, filePath);
  }
  if (filePath.includes('src')) {
    relPath = path.relative(`${process.cwd()}/${appRoot}/src`, filePath);
  }

  if (manifest.get(relPath) != null) {
    return;
  }

  if (filePath.match(CACHE_BUST)) {
    // Does not need a revision. Filename already contains a hash
    manifest.set(relPath, { url: relPath, revision: '' });
    return;
  }

  const content = contents || (await readFileSync(filePath));
  const hash = await createHash(content);
  manifest.set(relPath, { url: relPath, revision: hash } as ManifestEntry);
}

async function createHash(content: BufferSource) {
  const hash: ArrayBuffer = await crypto.subtle.digest('SHA-256', content);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default wbInject;
