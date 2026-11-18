/* eslint-disable i18n/no-undefined-catalogue-key */
import { RuleTester } from 'eslint'
import rule from './no-undefined-catalogue-key.js'

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

tester.run('no-undefined-catalogue-key', rule, {
  valid: [
    { code: `import { strings as s } from '../src/i18n/strings.js'\nconst el = <p>{t(s.season_week)}</p>` },
    { code: `import { strings as s } from '../src/i18n/strings.js'\nconst x = s.season_week` },
  ],
  invalid: [
    {
      code: `import { strings as s } from '../src/i18n/strings.js'\nconst el = <p>{t(s.does_not_exist)}</p>`,
      errors: [{ messageId: 'undefinedCatalogueKey', data: { key: 'does_not_exist' } }],
    },
    {
      code: `const x = 'season_week_typo'`,
      errors: [{ messageId: 'undefinedCatalogueKey', data: { key: 'season_week_typo' } }],
    },
  ],
})