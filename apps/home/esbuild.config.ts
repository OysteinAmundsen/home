import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';
import * as path from 'path';

const MATCH_FILES = /^.+\.(js|css|svg|img|html|txt|webmanifest)$/i;
const manifest: { url: string; revision: string }[] = [];
const projectRoot = 'apps/home/src';

const wbInject: esbuild.Plugin = {
  name: 'wbInject',
  setup(build: esbuild.PluginBuild) {
    // Append sw to entry points
    // This is done so that it is discoverable in the onEnd hook
    const options = build.initialOptions;
    Object.assign(options.entryPoints || {}, {
      sw: path.resolve(projectRoot, 'sw.ts'),
    });
    let workerCode = '';

    // Pre-build the worker, so that we get a single module for this
    // as angular would chunk it otherwise
    build.onStart(async () => {
      const result = await esbuild.build({
        entryPoints: [projectRoot + '/sw.ts'],
        bundle: true,
        write: false,
        minify: true,
        platform: 'browser',
        target: 'es2017',
      });
      workerCode = result.outputFiles[0].text;
    });

    // Inject manifest into worker
    build.onEnd(async (result) => {
      if (result.errors.length !== 0) return;

      // Add build output to manifest
      const files =
        result.outputFiles?.filter(
          (f) => f.path.match(MATCH_FILES) && !f.path.match(/sw/),
        ) || [];
      for (const file of files) await addToManifest(file.path, file.contents);

      const workerFile = result.outputFiles?.find((file) =>
        file.path.match(/sw.*\.js$/),
      );
      const workerSourceMap = result.outputFiles?.find((file) =>
        file.path.match(/sw.*\.js.map$/),
      );
      if (!workerFile) return;

      // Remove cache busting from worker file
      [
        workerFile,
        ...(workerSourceMap != null ? [workerSourceMap] : []),
      ].forEach(
        (file) => (file.path = file.path.replace(/\-[A-Z0-9]{8}\./, '.')),
      );

      // Inject manifest into worker
      const updatedWorkerCode = workerCode.replace(
        'self.__WB_MANIFEST',
        JSON.stringify(manifest),
      );

      // Update the worker file in the output
      workerFile.contents = new TextEncoder().encode(updatedWorkerCode);
    });
  },
};

async function addToManifest(filePath: string, contents?: Uint8Array) {
  const relPath = path.relative(process.cwd(), filePath);
  if (manifest.findIndex((i) => i.url === relPath) !== -1) return;

  const content =
    contents || (await readFileSync(path.resolve(projectRoot, relPath)));
  const hash = await createHash(content);
  manifest.push({ url: relPath, revision: hash });
}

async function createHash(content: BufferSource) {
  const hash: ArrayBuffer = await crypto.subtle.digest('SHA-256', content);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default wbInject;
