module.exports = function (api) {
  api.cache(true);

  // Build plugins list conditionally. In some CI or constrained environments
  // the `babel-plugin-module-resolver` (and its transitive deps like `glob`)
  // can cause the Babel process to fail during early require/transform steps.
  // Guard inclusion so tests and global-setup scripts can run even if the
  // plugin or its dependencies aren't resolvable in the environment.
  const plugins = [];

  // Prefer to include `module-resolver` when available unless explicitly disabled.
  if (!process.env.BABEL_DISABLE_MODULE_RESOLVER) {
    try {
      // Only include if the package can be resolved to avoid throwing here.
      require.resolve('babel-plugin-module-resolver');
      plugins.push(['module-resolver', { root: ['./'], alias: { '@': './' } }]);
    } catch (err) {
      // Plugin not available in this environment; skip it to keep transforms safe.
      // eslint-disable-next-line no-console
      console.warn('Skipping babel-plugin-module-resolver: not resolvable in this environment');
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('BABEL_DISABLE_MODULE_RESOLVER set; skipping module-resolver plugin');
  }

  // Add other needed plugins
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
