/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import-x/no-named-as-default-member */
import js from '@eslint/js';
import renovate from '@renovate/eslint-plugin';
// eslint-disable-next-line import-x/no-rename-default
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImportX from 'eslint-plugin-import-x';
import pluginPromise from 'eslint-plugin-promise';
import globals from 'globals';
// eslint-disable-next-line import-x/no-rename-default
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      '**/html/',
      '**/__mocks__/',
      '**/.pnp.*',
      '.yarn/*',
      '**/pnpm-lock.yaml',
      '**/*.snap',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginImportX.flatConfigs.errors,
  eslintPluginImportX.flatConfigs.warnings,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  vitest.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  {
    plugins: {
      '@renovate': renovate,
      '@vitest': vitest,
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.js'],
      },
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['tsconfig.lint.json', 'tools/jsconfig.json'],
        },
      },
    },
  },
  eslintConfigPrettier,
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    rules: {
      curly: [2, 'all'],

      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      'import-x/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],

      '@typescript-eslint/interface-name-prefix': 0,

      '@typescript-eslint/explicit-function-return-type': [
        2,
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        2,
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/camelcase': 0,
      '@typescript-eslint/no-floating-promises': 2,
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 0,
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@renovate/jest-root-describe': 2,
      'jest/valid-title': [
        0,
        {
          ignoreTypeOfDescribeName: true,
        },
      ],
      '@typescript-eslint/no-require-imports': 0,
    },
  },
  {
    files: ['tools/**/*.js'],
    rules: {
      'import-x/default': 1,
      'import-x/no-named-as-default-member': 1,
    },
  },
);
