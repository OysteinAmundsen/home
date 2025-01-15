import {
  BuilderContext,
  createBuilder,
  targetFromTargetString,
} from '@angular-devkit/architect';
import {
  ApplicationBuilderOptions,
  DevServerBuilderOutput,
  executeDevServerBuilder,
} from '@angular-devkit/build-angular';
import { Schema } from '@angular-devkit/build-angular/src/builders/app-shell/schema';
import { getSystemPath, json, normalize } from '@angular-devkit/core';
import { Observable, from, switchMap } from 'rxjs';

export function executeCustomDevServerBuilder(
  options: ApplicationBuilderOptions,
  context: BuilderContext,
): Observable<DevServerBuilderOutput> {
  const buildTarget = targetFromTargetString(options.buildTarget);

  async function getBuildTargetOptions() {
    return (await context.getTargetOptions(
      buildTarget,
    )) as unknown as json.JsonObject;
  }

  const workspaceRoot = getSystemPath(normalize(context.workspaceRoot));

  return from(getBuildTargetOptions()).pipe(
    switchMap(async (buildOptions) =>
      executeDevServerBuilder(options, context),
    ),
  );
}

export default createBuilder<Schema>(executeCustomDevServerBuilder);
