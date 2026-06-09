// Root eslint flat config (ESLint v9+).
// Per-app linting is handled by each app's own config (apps/api/.eslintrc.js etc.)
// and the turbo lint pipeline. This file exists so the root lint-staged hook
// can invoke eslint without an "eslint.config not found" error.
module.exports = [
  {
    ignores: ['**/*'],
  },
];
