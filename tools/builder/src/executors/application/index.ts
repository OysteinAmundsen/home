import {
  BuilderContext,
  BuilderOutputLike,
  createBuilder,
} from '@angular-devkit/architect';
import { buildApplication } from '@angular-devkit/build-angular';
import { json } from '@angular-devkit/core';
import { from, switchMap } from 'rxjs';

export function buildCustomEsbuildApplication(
  options: json.JsonObject,
  context: BuilderContext,
): BuilderOutputLike {
  return from(
    context.getTargetOptions({
      project: context.target?.project ?? '',
      target: 'build',
    }),
  ).pipe(switchMap(async (buildOptions) => buildApplication(options, context)));
}

export default createBuilder<json.JsonObject>(buildCustomEsbuildApplication);
