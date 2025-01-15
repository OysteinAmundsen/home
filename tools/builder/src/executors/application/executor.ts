import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import {
  buildApplication,
  DevServerBuilderOptions,
} from '@angular-devkit/build-angular';

export function buildCustomApplication(
  options: DevServerBuilderOptions,
  context: BuilderContext,
) {
  // const buildTarget = targetFromTargetString(options.buildTarget);

  // async function getBuildTargetOptions() {
  //   return (await context.getTargetOptions(
  //     buildTarget,
  //   )) as unknown as json.JsonObject;
  // }

  // return from(getBuildTargetOptions()).pipe(
  //   switchMap(async (buildOptions) => buildApplication(options, context)),
  // );
  return buildApplication(options, context);
}

export default createBuilder<DevServerBuilderOptions>(buildCustomApplication);
