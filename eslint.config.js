// Central ESLint config entry for the repository. We only use this file to
// declare 'ignores' for very large generated folders so that ESLint will not
// attempt to scan them when running in the new Flat Config mode. The project
// still uses legacy `.eslintrc.json` files for per-package rules — keep those
// intact.

// Keep this file minimal: the repository mainly uses per-package legacy
// ESLint configs (for example `backend/.eslintrc.json`). Export only the
// `ignores` property so the flat-config-aware CLI does not attempt to scan
// large generated folders in CI or local runs.
export default {
  ignores: [
    'dist/',
    'backend/dist/',
    'docs/',
    'templates/',
    'server/data/',
    'coverage/',
    'node_modules/',
    'backend/node_modules/',
    '*.lock'
  ]
};
