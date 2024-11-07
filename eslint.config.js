/* eslint-disable import/no-named-as-default-member */
import eslintContainerbase from '@containerbase/eslint-plugin';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import pluginPromise from 'eslint-plugin-promise';
import globals from 'globals';
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
  eslintPluginImport.flatConfigs.errors,
  eslintPluginImport.flatConfigs.warnings,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  vitest.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  eslintContainerbase.configs.all,
  {
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
      'import/resolver': {
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

      'import/order': [
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
      '@typescript-eslint/no-require-imports': 0,
    },
  },
  {
    files: ['tools/**/*.js'],
    rules: {
      'import/default': 1,
      'import/no-named-as-default-member': 1,
    },
  },
);
