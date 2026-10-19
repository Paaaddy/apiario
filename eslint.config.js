import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import noHardcodedUiText from './eslint-rules/no-hardcoded-ui-text.js'

export default [
  { ignores: ['dist'] },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', globals: globals.node },
    rules: js.configs.recommended.rules,
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      i18n: { rules: { 'no-hardcoded-ui-text': noHardcodedUiText } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': 'error',
      // DE/EN are language codes: identical in both locales, so the bilingual
      // contract has nothing to translate. Everything else must go through
      // strings.js; escape per site with a disable comment that says why.
      'i18n/no-hardcoded-ui-text': ['error', { allow: ['DE', 'EN'] }],
    },
  },
]
