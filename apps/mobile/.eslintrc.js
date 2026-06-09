module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  env: { 'react-native/react-native': true },
  plugins: ['react-native'],
  ignorePatterns: ['.expo/**', 'node_modules/**'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'off',
  },
}
