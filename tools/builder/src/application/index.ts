import { loadModule } from '@angular-builders/common';
import type { buildApplication as buildApplicationFn } from '@angular-devkit/build-angular';
import { buildApplication } from '@angular-devkit/build-angular';
import { getSystemPath, normalize } from '@angular-devkit/core';
import { ApplicationBuilderExtensions } from '@angular/build';
import type { ApplicationExecutorOptions } from '@nx/angular/src/executors/application/schema';
import type { ExecutorContext } from '@nx/devkit';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createBuilderContext } from 'nx/src/adapter/ngcli-adapter';
import { loadPlugins } from '../load-plugins';

/**
 * Custom NX executor for building an application and collecting
 * output artifacts to inject into our service worker
 *
 * @param options
 * @param context
 */
export default async function* applicationExecutor(
  options: ApplicationExecutorOptions,
  context: ExecutorContext,
): ReturnType<typeof buildApplicationFn> {
  // Setup context
  const workspaceRoot = getSystemPath(normalize(context.cwd));
  const builderContext = await createBuilderContext(
    {
      builderName: 'application',
      description: 'Build an application.',
      optionSchema: require('./schema.json'),
    },
    context,
  );

  // Load plugins
  const codePlugins = await loadPlugins(
    options.plugins,
    workspaceRoot,
    options.tsConfig,
    builderContext.logger,
  );

  // Load transformers
  const indexHtmlTransformer = options.indexHtmlTransformer
    ? await loadModule(
        path.join(workspaceRoot, options.indexHtmlTransformer),
        options.tsConfig,
        builderContext.logger,
      )
    : undefined;

  // Build application
  for await (const result of buildApplication(options, builderContext, {
    codePlugins,
    indexHtmlTransformer,
  } as ApplicationBuilderExtensions)) {
    // Read output artifacts from disk
    const outputPath = path.join(
      workspaceRoot,
      options.outputPath || 'dist',
      'browser',
    );
    const artifacts = await readDirAsync(outputPath);

    // Compile service worker
    // Create hash from artifacts without cache buster
    // Create manifest from all artifacts
    // Write manifest to service worker
    console.log(artifacts);
    yield result;
  }
}

/* Wrapper function to convert the fs.readdir function to a promise */
function readDirAsync(directory: string) {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        resolve([]);
      } else {
        resolve(files);
      }
    });
  });
}
