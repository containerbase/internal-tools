/* eslint-disable import-x/no-named-as-default-member */
import eslintContainerbase from '@containerbase/eslint-plugin';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import * as importX from 'eslint-plugin-import-x';
import pluginPromise from 'eslint-plugin-promise';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const jsFiles = { files: ['**/*.{js,cjs,mjs,mts,ts}'] };

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
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  vitest.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  eslintContainerbase.configs.all,
  {
    ...jsFiles,
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],

    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },

    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: 'tsconfig.lint.json' }),
      ],
    },
  },
  eslintConfigPrettier,
  {
    ...jsFiles,
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
    rules: {
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
