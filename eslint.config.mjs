import nextVitals from 'eslint-config-next/core-web-vitals';
import kaido from './eslint-rules/index.js';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'out/**',
      'public/**',
      'docs/source/**',
      'next-env.d.ts',
    ],
  },
  ...nextVitals,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { kaido },
    rules: {
      'kaido/no-client-server-imports': 'error',
      'kaido/no-deep-cross-module-imports': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['scripts/**/*.js', 'test/**/*.js', 'eslint-rules/**/*.js', '*.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
