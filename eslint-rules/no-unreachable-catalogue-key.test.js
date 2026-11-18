import { RuleTester } from 'eslint'
import rule from './no-unreachable-catalogue-key.js'

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
})

tester.run('no-unreachable-catalogue-key', rule, {
  valid: [
    {
      filename: 'src/i18n/strings.js',
      code: `export const strings = { only_key: { de: 'a', en: 'b' } }`,
    },
  ],
  invalid: [],
})