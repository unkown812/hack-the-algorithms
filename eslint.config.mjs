import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    ignores: ['dist/**', 'node_modules/**', '*.vsix', 'test/**'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        globalThis: 'readonly',
        window: 'readonly',
        document: 'readonly',
        MessageEvent: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'semi': 'error',
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-const': 'error',
      'curly': 'error',
      'eqeqeq': ['error', 'always'],
      'no-fallthrough': 'error',
      'no-shadow': 'warn',
      'no-throw-literal': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
