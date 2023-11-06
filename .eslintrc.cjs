/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
  },
  plugins: [
    '@renovate',
    '@typescript-eslint',
    'typescript-enum',
    'jest-formatting',
  ],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:promise/recommended',
    'plugin:jest-formatting/recommended',
    'prettier',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.lint.json', 'tools/jsconfig.json'],
  },
  rules: {
    curly: [2, 'all'],

    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true, // conflicts with our other import ordering rules
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
    // Makes no sense to allow type inferrence for expression parameters, but require typing the response
    '@typescript-eslint/explicit-function-return-type': [
      2,
      { allowExpressions: true, allowTypedFunctionExpressions: true },
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
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.js'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
        project: ['tsconfig.lint.json', 'tools/jsconfig.json'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {},
    },
    {
      files: ['**/*.js', '**/*.mjs'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 0,
      },
    },
    {
      files: ['**/*.spec.ts', 'test/**'],
      env: {
        jest: true,
      },
      rules: {
        '@renovate/jest-root-describe': 2,

        'jest/valid-title': [0, { ignoreTypeOfDescribeName: true }],
      },
    },
    {
      files: ['tools/**/*.js'],
      rules: {
        // TODO: fix me
        'import/default': 1,
        'import/no-named-as-default-member': 1,
      },
    },
  ],
};
