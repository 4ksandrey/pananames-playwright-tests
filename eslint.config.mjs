import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'playwright/.auth/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
