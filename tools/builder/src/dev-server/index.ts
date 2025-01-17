// import { PromiseExecutor } from '@nx/devkit';
// import { DevServerExecutorSchema } from './schema';

// const runExecutor: PromiseExecutor<DevServerExecutorSchema> = async (
//   options,
// ) => {
//   console.log('Executor ran for DevServer', options);
//   return {
//     success: true,
//   };
// };

// export default runExecutor;
import { loadModule } from '@angular-builders/common';
import {
  BuilderContext,
  createBuilder,
  targetFromTargetString,
} from '@angular-devkit/architect';
import {
  DevServerBuilderOptions,
  DevServerBuilderOutput,
  executeDevServerBuilder,
} from '@angular-devkit/build-angular';
import { getSystemPath, json, normalize } from '@angular-devkit/core';
import type { IndexHtmlTransform } from '@angular/build/src/utils/index-file/index-html-generator';
import * as path from 'node:path';
import { Observable, from, switchMap } from 'rxjs';

import { loadPlugins } from '../load-plugins';

export function executeCustomDevServerBuilder(
  options: DevServerBuilderOptions,
  context: BuilderContext,
): Observable<DevServerBuilderOutput> {
  const buildTarget = targetFromTargetString(options.buildTarget);
  const workspaceRoot = getSystemPath(normalize(context.workspaceRoot));

  return from(context.getTargetOptions(buildTarget)).pipe(
    switchMap(async (buildOptions) => {
      const tsConfig = path.join(workspaceRoot, buildOptions.tsConfig);
      const buildPlugins = await loadPlugins(
        buildOptions.plugins,
        workspaceRoot,
        tsConfig,
        context.logger,
      );

      const indexHtmlTransformer: IndexHtmlTransform =
        buildOptions.indexHtmlTransformer
          ? await loadModule(
              path.join(workspaceRoot, buildOptions.indexHtmlTransformer),
              tsConfig,
              context.logger,
            )
          : undefined;

      return {
        transforms: { indexHtml: indexHtmlTransformer },
        extensions: { buildPlugins },
      };
    }),
    switchMap(({ transforms, extensions }) =>
      executeDevServerBuilder(options, context, transforms, extensions),
    ),
  );
}

export default createBuilder<DevServerBuilderOptions & json.JsonObject>(
  executeCustomDevServerBuilder,
);
