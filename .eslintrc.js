module.exports = {
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb',
    'prettier',
    'plugin:react/recommended',
    'eslint:recommended',
  ],
  env: {
    browser: true,
    mocha: true,
    node: true,
    jest: true,
    es6: true,
  },
  plugins: ['@typescript-eslint', 'prettier', 'react-hooks', 'react'],
  rules: {
    'react/button-has-type': 0,
    'react/no-array-index-key': 0,
    'jsx-a11y/no-noninteractive-element-interactions': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'no-use-before-define': 0,
    'jsx-a11y/no-autofocus': 0,
    'react/sort-comp': 0,
    'react/prefer-stateless-function': 0,
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],
    'no-underscore-dangle': 0,
    'no-debugger': 0,
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],
    'import/prefer-default-export': 0,
    'object-shorthand': 0,
    'react/forbid-prop-types': 0,
    'class-methods-use-this': 0,
    'react/jsx-filename-extension': 0,
    'react/jsx-props-no-spreading': 0,
    'react/prop-types': 0,
    'import/no-extraneous-dependencies': 0,
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': 1,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
    'import/no-named-default': 0,
    'no-self-compare': 0,
    'no-new': 0,
    'jsx-a11y/label-has-for': 0,
    'no-shadow': 0,
    'no-case-declarations': 0,
    'no-await-in-loop': 0,
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'no-return-assign': 0,
    'no-nested-ternary': 0,
    'no-unused-vars': 0,
    'no-unused-locals': 0,
    camelcase: 0,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],

    'react/jsx-uses-react': 0,
    'react/react-in-jsx-scope': 0,
  },
  overrides: [
    {
      files: '*.test.ts',
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['./src'],
      },
    },
  },
};
