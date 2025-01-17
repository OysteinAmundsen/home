import { loadModule } from '@angular-builders/common';
import type { logging } from '@angular-devkit/core';
import type { Plugin } from 'esbuild';
import * as path from 'node:path';

export type PluginConfig =
  | string
  | { path: string; options?: Record<string, unknown> };

export async function loadPlugins(
  pluginConfig: PluginConfig[] | undefined,
  workspaceRoot: string,
  tsConfig: string,
  logger: logging.LoggerApi,
): Promise<Plugin[]> {
  const plugins = await Promise.all(
    (pluginConfig || []).map(async (pluginConfig) => {
      if (typeof pluginConfig === 'string') {
        return loadModule<Plugin | Plugin[]>(
          path.join(workspaceRoot, pluginConfig),
          tsConfig,
          logger,
        );
      } else {
        const pluginFactory = await loadModule<(...args: any[]) => Plugin>(
          path.join(workspaceRoot, pluginConfig.path),
          tsConfig,
          logger,
        );
        return pluginFactory(pluginConfig.options);
      }
    }),
  );

  return plugins.flat();
}
