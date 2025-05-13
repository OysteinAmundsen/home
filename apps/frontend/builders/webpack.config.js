//@ts-check
const path = require('path');
const webpack = require('webpack');
const { injectManifest } = require('workbox-build');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const PLUGIN_NAME = 'generate-manifest-and-inject';

/**
 * This needs to run after angular has compiled and copied out everything
 * so that the files are available to be precached.
 *
 * I tried running this as a custom webpack configuration inside the angular
 * build, but there are no hooks that fire after the files are copied out.
 * The biggest problem with that, is that the index.html is not available
 * to be precached and the service worker is therefore not able to control
 * the page on the first load. Installation therefore fails.
 */
class GenerateManifestAndInject {
  /**
   * @param {webpack.Compiler} compiler
   */
  apply(compiler) {
    // Inject manifest
    compiler.hooks.afterEmit.tapPromise(
      this.constructor.name,
      (compilation) => {
        const dest = compilation.options.output.path;
        const swFile = compilation.options.output.filename;
        return injectManifest({
          swSrc: `${dest}/${swFile}`,
          swDest: `${dest}/${swFile}`,
          globDirectory: `${dest}/`,
          globPatterns: [
            '**/*.{html,js,css,json,xml,webmanifest}', // static resources
            '**/*.{ico,ttf,woff,woff2,png}', // fonts and icons
          ],
          globFollow: true, // follow symlinks
          globStrict: true, // fail the build if anything goes wrong while reading the files
          globIgnores: ['**/*-es5.js', '**/*.(js|css).map'],
          dontCacheBustURLsMatching: /-[A-Z0-9]{8}\./,
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        }).then((compilationDone) => {
          const logger = compilation.getLogger(PLUGIN_NAME);
          logger.info(
            `Generated ${dest}/${swFile}, which will precache ${compilationDone.count} files (${compilationDone.size} bytes)`,
          );
        });
      },
    );
  }
}

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './apps/frontend/src/sw.ts',
  output: {
    filename: 'sw.js',
    path: path.resolve('./dist/apps/frontend/browser'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: { configFile: 'tsconfig.wb.json', logLevel: 'info' },
      },
    ],
  },
  resolve: {
    modules: ['./apps/frontend/src', 'node_modules'],
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve('./tsconfig.base.json'), // Ensure this points to your base tsconfig
      }),
    ],
  },
  plugins: [new GenerateManifestAndInject()],
};
