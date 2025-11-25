// ESLint Flat Config for backend code
module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.lock',
    ],
  },
  {
  // Lint backend TypeScript files under the `backend/src` directory when
  // this config is loaded from the repository root.
  files: ['backend/src/**/*.{ts,tsx}'],
    languageOptions: (function () {
      // Helper that attempts to require modules relative to repo root
      // and falls back to Node resolution. This makes the flat config
      // resilient when run from the repo root or from within the
      // backend folder (for in-image runs where node_modules may live
      // in different places).
      const path = require('path');
      const resolveRequire = (mod) => {
        try {
          return require(mod);
        } catch (err) {
          // Try resolving from backend node_modules first, then repo node_modules
          const candidate = require.resolve(mod, {
            paths: [path.join(__dirname, 'backend', 'node_modules'), path.join(__dirname, 'node_modules')],
          });
          return require(candidate);
        }
      };

      return {
        parser: resolveRequire('@typescript-eslint/parser'),
        parserOptions: Object.assign(
          {
            ecmaVersion: 2022,
            sourceType: 'module',
            ecmaFeatures: { jsx: false },
          },
          process.env.ESLINT_TYPECHECK === 'true'
            ? (function () {
                const p = require('path');
                // Support two locations: when this config is at repo root
                // (__dirname + '/backend/tsconfig.json') and when the config
                // is copied into the backend folder (__dirname + '/tsconfig.json').
                const candidateA = p.join(__dirname, 'backend', 'tsconfig.json');
                const candidateB = p.join(__dirname, 'tsconfig.json');
                const fs = require('fs');
                if (fs.existsSync(candidateB)) return { project: candidateB };
                return { project: candidateA };
              })()
            : {}
        ),
      };
    })(),
    plugins: (function () {
      const path = require('path');
      const resolveRequire = (mod) => {
        try {
          return require(mod);
        } catch (err) {
          const candidate = require.resolve(mod, {
            paths: [path.join(__dirname, 'backend', 'node_modules'), path.join(__dirname, 'node_modules')],
          });
          return require(candidate);
        }
      };

      // Attempt to load optional prettier plugin; if it's not present the
      // config should still work (we don't want linting config load to
      // crash in minimal environments). Return only the plugins that are
      // available.
      const plugins = {
        '@typescript-eslint': resolveRequire('@typescript-eslint/eslint-plugin'),
      };
      try {
        plugins.prettier = resolveRequire('eslint-plugin-prettier');
      } catch (e) {
        // prettier plugin not installed in this environment; continue without it
      }

      return plugins;
    })(),
    rules: Object.assign(
      {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
      // Only enable prettier rule if the plugin is available
      (function () {
        try {
          require.resolve('eslint-plugin-prettier', {
            paths: [require('path').join(__dirname, 'backend', 'node_modules'), require('path').join(__dirname, 'node_modules')],
          });
          return { 'prettier/prettier': 'error' };
        } catch (e) {
          return {};
        }
      })()
    ),
  },
];
