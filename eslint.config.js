import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-var': 'off',
      'eqeqeq': ['warn', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'content/',
      'images/',
      'audio/',
      'scripts/sync-registry.py',
      'scripts/import-notion.js',
      'scripts/backup-kv.js',
      '.github/',
    ],
  },
];
