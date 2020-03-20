module.exports = {
  root: true,
  env: {
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parserOptions: {
    ecmaVersion: 9,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 0,
    // Makes no sense to allow type inferrence for expression parameters, but require typing the response
    '@typescript-eslint/explicit-function-return-type': [
      1,
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    '@typescript-eslint/no-unused-vars': [
      1, // TODO: error
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: '^_',
      },
    ],

    //TODO: fixme
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/camelcase': 0,
    'no-prototype-builtins': 1,
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.mjs'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 0,
      },
    },
    {
      files: ['**/*.spec.ts'],
      env: {
        jest: true,
        node: true,
      },
      rules: {},
    },
    {
      files: ['Gruntfile.js', 'tools/**/*.js'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 0,
      },
    },
  ],
};
