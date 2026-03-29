import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: [
      'node_modules/**',
      '**/service-worker*.js',
      '**/workers/**',
      'assets/js/modules/**',
    ],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        WeakMap: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Promise: 'readonly',
        Symbol: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
    },
  },
];
