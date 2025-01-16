import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import {
  DevServerBuilderOutput,
  executeDevServerBuilder,
} from '@angular-devkit/build-angular';
import { Schema } from '@angular-devkit/build-angular/src/builders/dev-server/schema';
import { Observable, from, switchMap } from 'rxjs';

export function executeCustomDevServerBuilder(
  options: Schema,
  context: BuilderContext,
): Observable<DevServerBuilderOutput> {
  return from(
    context.getTargetOptions({
      project: context.target?.project ?? '',
      target: 'build',
    }),
  ).pipe(
    switchMap(async (buildOptions) =>
      executeDevServerBuilder(options, context),
    ),
  );
}

export default createBuilder<Schema>(executeCustomDevServerBuilder);
