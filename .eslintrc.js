module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-plusplus': 0,
    'operator-linebreak': 0,
    'no-shadow': 0,
    'import/no-extraneous-dependencies': 0,
  },
};
