module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'operator-linebreak': ['error', 'after'],
    'comma-dangle': [2, 'always-multiline'],
    'import/extensions': [
      'error',
      'never',
      {
        svg: 'always',
      },
    ],
    'no-shadow': [
      'error',
      {
        allow: ['state'],
      },
    ],
    'no-param-reassign': 0,
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        singleQuote: true,
        trailingComma: 'all',
        semi: false,
        'linebreak-style': 'windows',
      },
    ],
    'vue/html-closing-bracket-spacing': [
      'error',
      {
        startTag: 'never',
        endTag: 'never',
        selfClosingTag: 'never',
      },
    ],
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
