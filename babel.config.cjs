module.exports = function (api) {
  api.cache(true);

  // Build plugins list conditionally. In some CI or constrained environments
  // the `babel-plugin-module-resolver` (and its transitive deps like `glob`)
  // can cause the Babel process to fail during early require/transform steps.
  // Guard inclusion so tests and global-setup scripts can run even if the
  // plugin or its dependencies aren't resolvable in the environment.
  const plugins = [];

  // Module resolver has compatibility issues with jest global-setup
  // Keep it disabled for now. Re-enable with caution and proper testing.
  if (process.env.BABEL_ENABLE_MODULE_RESOLVER === '1') {
    try {
      // Only include if the package can be resolved to avoid throwing here.
      require.resolve('babel-plugin-module-resolver');
      // Use absolute __dirname for root to avoid path resolution issues
      const rootDir = __dirname;
      const moduleResolverConfig = {
        root: [rootDir],
        alias: { '@': rootDir }
      };
      plugins.push(['module-resolver', moduleResolverConfig]);
      // eslint-disable-next-line no-console
      console.log('babel-plugin-module-resolver enabled');
    } catch (err) {
      // Plugin not available in this environment; skip it to keep transforms safe.
      // eslint-disable-next-line no-console
      console.warn('Failed to enable babel-plugin-module-resolver: ', err.message);
    }
  }

  // Add other needed plugins
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
