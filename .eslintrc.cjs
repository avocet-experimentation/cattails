module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'airbnb-typescript'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  rules: {
    'no-unused-vars': 'off', // handled by TS
    'implicit-arrow-linebreak': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: ['**/*.test.ts', '**/*.spec.ts', 'vitest.config.ts'] }
    ]
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  }
};
