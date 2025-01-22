import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  scheduleTargetAndForget,
  targetFromTargetString,
} from '@angular-devkit/architect';
import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { catchError, defer, Observable, of, switchMap } from 'rxjs';
import { ApplicationExecutorSchema } from './schema';

export type Manifest = ManifestEntry[];

export interface ManifestEntry {
  url: string;
  revision: string;
}

const MATCH_FILES = /^.+\.(js|css|svg|img|html|txt|webmanifest)$/i;
const manifest: Manifest = [];
const CACHE_BUST = /-[A-Z0-9]{8}\./;

/**
 * FIXME: Works with `serve` target. Not with `application` target.
 * But even though this runs the serve target and returns control to the
 * builder, I am unable to get the output files from the serve target.
 */
const builder$ = createBuilder(
  (
    opt: ApplicationExecutorSchema,
    ctx: BuilderContext,
  ): Observable<BuilderOutput> => {
    return defer(async () => {
      const target = targetFromTargetString(opt.buildTarget);
      const meta = await ctx.getProjectMetadata(target);
      const tOpts = await ctx.getTargetOptions(target);
      return { success: true, target, meta, tOpts };
    }).pipe(
      switchMap((o) => scheduleTargetAndForget(ctx, o.target)),
      switchMap((buildResult) => {
        const output = buildResult.result;
        ctx.logger.info(
          `Build target completed successfully. ${JSON.stringify(output)}`,
        );
        return of({ success: true });
      }),
      catchError((error) => {
        ctx.logger.error('Error running build target.', error);
        return of({ success: false });
      }),
    );
  },
);

/**
 * FIXME: Works with `application` target. Not with `serve` target.
 * This reads the output files from disk and creates a manifest from them.
 */
const builder = createBuilder(
  async (
    opt: ApplicationExecutorSchema,
    ctx: BuilderContext,
  ): Promise<BuilderOutput> => {
    try {
      // Run the specified build
      const target = targetFromTargetString(opt.buildTarget);
      const tOpts = await ctx.getTargetOptions(target);
      const buildResult = await ctx.scheduleTarget(target, tOpts);
      const result = await buildResult.result;

      if (!result.success) {
        ctx.logger.error('Error running build target.');
        return { success: false };
      }

      // Infer the manifest from the previous builder's output
      const outputPath = path.resolve(
        ctx.workspaceRoot,
        `${tOpts.outputPath}`,
        'browser',
      );
      const manifest = fs
        .readdirSync(outputPath, { recursive: true })
        .filter((file) => !`${file}`.endsWith('\\')) // Discard directories
        .map((file) => {
          return { url: `${file}`.replace('\\', '/'), revision: '' }; // TODO: Calculate hash for non-cache-busted files
        });

      // Compile the service worker file using esbuild
      const swFilePath = path.resolve(ctx.workspaceRoot, opt.serviceWorker);
      const fileName = path.basename(swFilePath, path.extname(swFilePath));
      const outputFile = path.resolve(outputPath, `${fileName}.js`);
      const swBuild = await esbuild.build({
        entryPoints: [swFilePath],
        tsconfig: path.resolve(ctx.workspaceRoot, opt.tsConfig),
        bundle: true,
        write: false,
        minify: true,
      });
      let serviceWorkerContent = swBuild.outputFiles[0].text;

      // Replace the `self.__WB_MANIFEST` string with the list of files
      serviceWorkerContent = serviceWorkerContent.replace(
        'self.__WB_MANIFEST',
        JSON.stringify(manifest),
      );

      // Write the modified service worker file back to disk
      fs.writeFileSync(outputFile, serviceWorkerContent);
      return { success: true };
    } catch (error) {
      ctx.logger.error('Error compiling service worker file:', error);
      return { success: false };
    }
  },
);

async function addToManifest(filePath: string, contents?: Uint8Array) {
  const relPath = path.relative(process.cwd(), filePath);

  if (manifest.findIndex((i) => i.url === relPath) !== -1) {
    return;
  }

  if (filePath.match(CACHE_BUST)) {
    manifest.push({ url: relPath, revision: '' });
    return;
  }

  const content = contents || (await fs.readFileSync(filePath));
  const hash = await createHash(content);
  manifest.push({ url: relPath, revision: hash } as ManifestEntry);
}

async function createHash(content: BufferSource) {
  const hash: ArrayBuffer = await crypto.subtle.digest('SHA-256', content);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default builder;
